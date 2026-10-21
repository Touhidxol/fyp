import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import models
from typing import Literal

load_dotenv()

class NoContentError(ValueError):
    """The notebook has no indexed content to build a test from."""


class InvalidGenerationError(ValueError):
    """The model returned a test that breaks our rules."""


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
    url=os.getenv("QDRANT_URL", "http://localhost:6333"),
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
        model="gemini-3.5-flash-lite",
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
# 8. Test Response Schema (MCQ only)
# --------------------------------------------------


class Question(BaseModel):
    question_number: int
    question: str
    type: Literal["mcq"]
    options: list[str]  # 2 to 6 options (True/False questions have exactly 2)
    marks: int
    difficulty: str
    answer: str  # must exactly match one option
    explanation: str


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

GENERATION_MODEL = os.getenv("GENERATION_MODEL", "gemini-3.5-flash-lite")

MIN_OPTIONS = 2
MAX_OPTIONS = 6


def validate_questions(test: GeneratedTest) -> GeneratedTest:
    """Backend grading is a plain string comparison, so the answer must be
    identical to one of the options. Fix casing/spacing, reject the rest."""
    for section in test.sections:
        for q in section.questions:
            n = len(q.options)
            if not (MIN_OPTIONS <= n <= MAX_OPTIONS):
                raise InvalidGenerationError(
                    f"Question {q.question_number} has {n} options; "
                    f"expected {MIN_OPTIONS} to {MAX_OPTIONS}."
                )

            lowered = [o.strip().lower() for o in q.options]
            if len(set(lowered)) != n:
                raise InvalidGenerationError(
                    f"Question {q.question_number} has duplicate options."
                )

            target = q.answer.strip().lower()
            match = next((o for o in q.options if o.strip().lower() == target), None)
            if match is None:
                raise InvalidGenerationError(
                    f"Question {q.question_number}: the answer is not one of the options."
                )
            q.answer = match  # exact option text
    return test

def generate_test(user_query, context, num_questions, difficulty, duration_minutes):
    duration_line = (
        f"The test duration must be {duration_minutes} minutes."
        if duration_minutes
        else "Choose a reasonable duration."
    )
    prompt = f"""
        You are an expert exam setter. Create a multiple-choice test using
        ONLY the study material below. Do not use outside knowledge.

        User request:
        {user_query}

        Study material:
        {context}

        Hard constraints (these override the user request if they conflict):
        - Generate EXACTLY {num_questions} questions in total.
        - EVERY question must be type "mcq". Never write short-answer questions,
          even if the user request asks for them.
        - Each question has exactly 4 options, and exactly one is correct.
        - Each question has between 2 and 6 options, and exactly one is correct.
        - Use 4 options for most questions. Use exactly 2 options ["True", "False"]
          for true/false statements. Use 5 or 6 only when the material naturally
          has that many distinct choices.
        - Options within a question must all be different from each other.
        - The "answer" field must be copied character-for-character from one
          of the options.
        - Do NOT put labels like "A)", "B)" or "1." in the options.
        - Overall difficulty: {difficulty}. If "Mixed", spread Easy/Moderate/Challenging.
        - {duration_line}
        - Add a one-sentence explanation for every answer.
        - Group questions into sensible sections.
    """

    interaction = client.interactions.create(
        model=GENERATION_MODEL,
        input=prompt,
        response_format=[
            {
                "type": "text",
                "mime_type": "application/json",
                "schema": GeneratedTest.model_json_schema(),
            }
        ],
    )

    test = GeneratedTest.model_validate_json(interaction.output_text)
    return validate_questions(test)


# --------------------------------------------------
# fastAPI requests
# --------------------------------------------------


def generate_test_for_request(
    user_query: str,
    notebook_id: str,
    num_questions: int = 10,
    difficulty: str = "Moderate",
    duration_minutes: int | None = None,
) -> dict:
    classification = classify_request(user_query)
    docs = retrieve_context(classification, notebook_id)

    if not docs:
        raise NoContentError(f"No content found for notebook '{notebook_id}'")

    context = build_context(docs)
    test = generate_test(
        user_query, context, num_questions, difficulty, duration_minutes
    )
    return test.model_dump()


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
    test = generate_test(user_query, context, 10, "Moderate", 30)

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
