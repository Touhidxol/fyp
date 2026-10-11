import os

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models
from pypdf import PdfReader

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION = "learning_platform"

MAX_PAGES = int(os.getenv("MAX_PAGES", 300))
MAX_CHUNKS = int(os.getenv("MAX_CHUNKS", 2500))


class DocumentTooLargeError(Exception):
    pass


embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview",
    google_api_key=os.getenv("GEMINI_API_KEY"),
)

qdrant = QdrantClient(url=QDRANT_URL)

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

# --------------------------------------------------
# Helpers
# --------------------------------------------------


def _filter(field: str, value: str) -> models.Filter:
    # langchain_qdrant stores metadata under the "metadata" key
    return models.Filter(
        must=[
            models.FieldCondition(
                key=f"metadata.{field}",
                match=models.MatchValue(value=value),
            )
        ]
    )


def ensure_payload_indexes() -> None:
    """Index the fields we filter on, so filtering stays fast as data grows."""
    if not qdrant.collection_exists(COLLECTION):
        return
    for field in ("notebook_id", "document_id", "user_id"):
        try:
            qdrant.create_payload_index(
                collection_name=COLLECTION,
                field_name=f"metadata.{field}",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass  # index already exists


def _delete_where(field: str, value: str) -> None:
    if not qdrant.collection_exists(COLLECTION):
        return
    qdrant.delete(
        collection_name=COLLECTION,
        points_selector=models.FilterSelector(filter=_filter(field, value)),
    )


def delete_document(document_id: str) -> None:
    _delete_where("document_id", document_id)


def delete_notebook(notebook_id: str) -> None:
    _delete_where("notebook_id", notebook_id)


# --------------------------------------------------
# Ingestion
# --------------------------------------------------


def ingest_pdf(
    file_path: str,
    *,
    user_id: str,
    notebook_id: str,
    document_id: str,
    document_name: str,
) -> dict:
    # Cheap check first: counts pages without extracting any text
    page_count = len(PdfReader(file_path).pages)
    if page_count > MAX_PAGES:
        raise DocumentTooLargeError(
            f"This PDF has {page_count} pages. The limit is {MAX_PAGES}. "
            "Try splitting it into smaller files."
        )

    pages = PyPDFLoader(file_path).load()
    chunks = text_splitter.split_documents(pages)
    chunks = [c for c in chunks if c.page_content.strip()]

    if not chunks:
        raise ValueError("No extractable text found. The PDF may be a scanned image.")

    if len(chunks) > MAX_CHUNKS:
        raise DocumentTooLargeError(
            f"This PDF produces {len(chunks)} chunks. The limit is {MAX_CHUNKS}. "
            "Try splitting it into smaller files."
        )

    for chunk in chunks:
        chunk.metadata.update(
            {
                "user_id": user_id,
                "notebook_id": notebook_id,
                "document_id": document_id,
                "document_name": document_name,
                "source": document_name,
            }
        )

    delete_document(document_id)  # re-ingest replaces old chunks

    try:
        QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=embedding_model,
            url=QDRANT_URL,
            collection_name=COLLECTION,
        )
    except Exception:
        # Embedding failed midway (rate limit, network): don't leave partial chunks
        delete_document(document_id)
        raise

    ensure_payload_indexes()
    return {"pages": page_count, "chunks": len(chunks)}
