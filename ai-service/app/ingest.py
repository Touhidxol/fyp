from pathlib import Path
import os
import uuid

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore

# Load environment variables
load_dotenv()


# -------------------------------------------------------------
# Application Metadata
# -------------------------------------------------------------

user_id = "001"
notebook_id = "0001"
document_id = str(uuid.uuid4())

# PDF
pdf_path = Path(__file__).parent.parent / "data" / "mml-book.pdf"
document_name = pdf_path.name


# -------------------------------------------------------------
# Load PDF
# -------------------------------------------------------------

loader = PyPDFLoader(str(pdf_path))
docs = loader.load()

print(f"Loaded {len(docs)} pages")


# -------------------------------------------------------------
# Split into chunks
# -------------------------------------------------------------

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=400)

chunks = text_splitter.split_documents(docs)

print(f"Created {len(chunks)} chunks")


# -------------------------------------------------------------
# Add Application Metadata to Every Chunk
# -------------------------------------------------------------

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


# Check one chunk
print("\nExample chunk :")
print(chunks[60])


# -------------------------------------------------------------
# Embedding Model
# -------------------------------------------------------------

embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview", google_api_key=os.getenv("GEMINI_API_KEY")
)


# -------------------------------------------------------------
# Store in Qdrant
# -------------------------------------------------------------

vector_store = QdrantVectorStore.from_documents(
    documents=chunks,
    embedding=embedding_model,
    url="http://localhost:6333",
    collection_name="learning_platform",
)

print("\nIndexing of documents done!")
print(f"User ID      : {user_id}")
print(f"Notebook ID  : {notebook_id}")
print(f"Document ID  : {document_id}")
print(f"Document     : {document_name}")

