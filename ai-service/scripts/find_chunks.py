# Dedicated for testing how many pages of a document are there as form of chunks in the VectorDB
import os

from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore

from qdrant_client.models import Filter, FieldCondition, MatchValue


load_dotenv()


# --------------------------------------------------
# 2. Embedding Model
# --------------------------------------------------

embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview",
    google_api_key=os.getenv("GEMINI_API_KEY")
)


# --------------------------------------------------
# 3. Connect to Existing Qdrant Collection
# --------------------------------------------------

vector_db = QdrantVectorStore.from_existing_collection(
    collection_name="learning_platform",
    embedding=embedding_model,
    url="http://localhost:6333"
)


# --------------------------------------------------
# 4. Get Qdrant Client
# --------------------------------------------------

qdrant_client = vector_db.client


# --------------------------------------------------
# 5. Document ID to search
# --------------------------------------------------

document_id = input(
    "Enter document_id: "
).strip()


# --------------------------------------------------
# 6. Filter points by document_id
# --------------------------------------------------

results, next_offset = qdrant_client.scroll(
    collection_name="learning_platform",

    scroll_filter=Filter(
        must=[
            FieldCondition(
                key="metadata.document_id",
                match=MatchValue(
                    value=document_id
                )
            )
        ]
    ),

    limit=100,

    with_payload=True,

    with_vectors=False
)


# --------------------------------------------------
# 7. Display results
# --------------------------------------------------

print("\n========================================")
print("FILTER RESULTS")
print("========================================")

print(f"Matching points: {len(results)}")


for i, point in enumerate(results, start=1):

    print(f"\n--- Point {i} ---")

    print("Point ID:", point.id)

    print("Payload:")

    print(point.payload)


# --------------------------------------------------
# 8. Display page information
# --------------------------------------------------

pages = []

for point in results:

    metadata = point.payload.get(
        "metadata",
        {}
    )

    page = metadata.get("page")

    if page is not None:
        pages.append(page)


print("\n========================================")
print("PAGE INFORMATION")
print("========================================")


if pages:

    print("Lowest page:", min(pages))
    print("Highest page:", max(pages))
    print("Unique pages:", len(set(pages)))

else:

    print("No page metadata found.")


print("\n========================================")
print("DONE")
print("========================================")

