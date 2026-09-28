import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import models

load_dotenv()

# --------------------------------------------------
# 1. Gemini Client
# --------------------------------------------------

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --------------------------------------------------
# 2. Embedding Model
# --------------------------------------------------

embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview", google_api_key=os.getenv("GEMINI_API_KEY")
)

# --------------------------------------------------
# 3. Connect to Existing Qdrant Collection
# --------------------------------------------------

vector_db = QdrantVectorStore.from_existing_collection(
    collection_name="learning_platform",
    embedding=embedding_model,
    url="http://localhost:6333",
)


# --------------------------------------------------
# 4. Request Classification Schema
# --------------------------------------------------


class RequestType(BaseModel):
    request_type: str
    topic: str | None = None


# --------------------------------------------------
# 5. Classify User Request
# --------------------------------------------------


def classify_request(user_query):

    prompt = f"""
        You are an exam-preparation assistant.

        Determine whether the user wants:

        1. "specific_topic"
        - The user wants questions/test from a particular topic.

        2. "whole_syllabus"
        - The user wants a test covering the entire subject,
            syllabus, book, notes, or uploaded material.

        If the request is specific_topic, extract name of the topic(s).

        User request:
        {user_query}

        Return:
        - request_type: "specific_topic" or "whole_syllabus"
        - topic: the topic name if specific_topic, otherwise null.
    """

    interaction = client.interactions.create(
        model="gemini-3.5-flash",
        input=prompt,
        response_format=[
            {
                "type": "text",
                "mime_type": "application/json",
                "schema": RequestType.model_json_schema(),
            }
        ],
    )

    return RequestType.model_validate_json(interaction.output_text)


# --------------------------------------------------
# 6. Retrieve Relevant Content
# --------------------------------------------------

def retrieve_context(classification, notebook_id: str):

    # langchain_qdrant stores document metadata under the "metadata" key,
    # so the payload field is "metadata.notebook_id"
    notebook_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="metadata.notebook_id",
                match=models.MatchValue(value=notebook_id),
            )
        ]
    )

    if classification.request_type == "specific_topic":
        print(f"\nDetected topic: {classification.topic}")
        docs = vector_db.similarity_search(
            classification.topic, k=8, filter=notebook_filter
        )
    else:
        print("\nDetected: Whole syllabus test")
        docs = vector_db.similarity_search(
            "key concepts and topics", k=25, filter=notebook_filter
        )

    return docs

# --------------------------------------------------
# 7. Build Context
# --------------------------------------------------

def build_context(docs):

    context = ""

    for i, doc in enumerate(docs):

        page = doc.metadata.get("page", "Unknown")
        source = doc.metadata.get("source", "Unknown")

        context += f"""
            --- Document {i + 1} ---
            Source: {source}
            Page: {page}

            {doc.page_content}
        """

    return context


# --------------------------------------------------
# 8. Test Response Schema
# --------------------------------------------------


class Question(BaseModel):
    question_number: int
    question: str
    marks: int
    difficulty: str
    answer: str


class Section(BaseModel):
    section_name: str
    instructions: str | None = None
    questions: list[Question]


class GeneratedTest(BaseModel):
    test_name: str
    subject: str
    topic: str | None = None
    duration_minutes: int
    total_marks: int
    instructions: list[str]
    sections: list[Section]


# --------------------------------------------------
# 9. Generate Test
# --------------------------------------------------


def generate_test(user_query, context):

    prompt = f"""
        You are an AI exam-generation assistant.

        Generate a complete examination test based ONLY on
        the provided study material.

        User request:
        {user_query}

        Study material:
        {context}

        Requirements:

        1. Generate meaningful exam questions.
        2. Do not invent information outside the provided material if that is sufficient.
        3. Follow the user's requested topic/content.
        4. Organize the questions into logical sections.
        5. Assign appropriate marks to every question.
        6. Assign a difficulty level:
            - Easy
            - Medium
            - Hard
        7. Include the correct answer for every question.
        8. Generate a suitable test name.
        9. Choose a reasonable duration based on the number and difficulty of questions.
        10. Ensure total_marks equals the sum of marks of all questions.
        11. Keep the test suitable for an academic examination.

        Return the test using the provided JSON schema.
    """


    response = client.interactions.create(
        model="gemini-3.5-flash",
        input=prompt,
        response_format=[
            {
                "type": "text",
                "mime_type": "application/json",
                "schema": GeneratedTest.model_json_schema(),
            }
        ],
    )

    return GeneratedTest.model_validate_json(response.output_text)

# --------------------------------------------------
# fastAPI requests
# --------------------------------------------------

def generate_test_for_request(user_query: str, notebook_id: str) -> dict:
    classification = classify_request(user_query)
    docs = retrieve_context(classification, notebook_id)

    if not docs:
        raise ValueError(f"No content found for notebook '{notebook_id}'")

    context = build_context(docs)
    test = generate_test(user_query, context)
    return test.model_dump()  # plain dict, FastAPI turns it into JSON

# --------------------------------------------------
# MAIN
# --------------------------------------------------

if __name__ == "__main__":

    user_query = input("What kind of test do you want? \n > ")

    # STEP 1 + 2:
    classification = classify_request(user_query)

    print("\nClassification:")
    print(classification)

    # STEP 3:
    notebook_id = "0001"
    docs = retrieve_context(classification, notebook_id)

    print(f"\nRetrieved {len(docs)} documents.")

    # STEP 4:
    context = build_context(docs)

    # STEP 5:
    test = generate_test(user_query, context)

    print("\n========== GENERATED TEST ==========\n")

    print(f"Test Name      : {test.test_name}")
    print(f"Subject        : {test.subject}")
    print(f"Topic          : {test.topic}")
    print(f"Duration       : {test.duration_minutes} minutes")
    print(f"Total Marks    : {test.total_marks}")

    print("\nInstructions:")
    for instruction in test.instructions:
        print(f"- {instruction}")

    for section in test.sections:

        print(f"\n{'=' * 50}")
        print(f"{section.section_name}")
        print(f"{'=' * 50}")

        if section.instructions:
            print(f"Instructions: {section.instructions}")

        for q in section.questions:

            print(f"\nQ{q.question_number}. {q.question}")
            print(f"Marks      : {q.marks}")
            print(f"Difficulty : {q.difficulty}")
            print(f"Answer     : {q.answer}")
