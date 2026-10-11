import os
import shutil
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from pypdf.errors import PdfReadError

from .generate_test import generate_test_for_request
from .ingest import ingest_pdf, delete_document, delete_notebook, DocumentTooLargeError

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MAX_FILE_MB = int(os.getenv("MAX_FILE_MB", 25))

app = FastAPI()

@app.get("/")
def root():
    return {"status": "Server is up and running"}


class GenerateTestRequest(BaseModel):
    notebook_id: str = Field(
        ..., description="Notebook to fetch chunks from", examples=["0001"]
    )
    query: str = Field(
        ...,
        description="What kind of test to generate",
        examples=["20 mark test on eigenvalues"],
    )


@app.post("/generate-test")
def generate_test_endpoint(body: GenerateTestRequest):
    try:
        return generate_test_for_request(body.query, body.notebook_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@app.post("/ingest")
def ingest_endpoint(
    file: UploadFile = File(...),
    notebook_id: str = Form(...),
    document_id: str = Form(...),
    user_id: str = Form(...),
    document_name: str | None = Form(None),
):
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(415, "Only PDF files are supported")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        if os.path.getsize(tmp_path) > MAX_FILE_MB * 1024 * 1024:
            raise DocumentTooLargeError(f"File is larger than {MAX_FILE_MB} MB.")

        result = ingest_pdf(
            tmp_path,
            user_id=user_id,
            notebook_id=notebook_id,
            document_id=document_id,
            document_name=document_name or filename,
        )
        return {"document_id": document_id, **result}

    except DocumentTooLargeError as e:
        raise HTTPException(413, str(e))
    except (ValueError, PdfReadError) as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        # embedding API failure, Qdrant down, etc.
        raise HTTPException(502, f"Indexing failed: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.delete("/documents/{document_id}")
def delete_document_endpoint(document_id: str):
    delete_document(document_id)
    return {"deleted": document_id}


@app.delete("/notebooks/{notebook_id}")
def delete_notebook_endpoint(notebook_id: str):
    delete_notebook(notebook_id)
    return {"deleted": notebook_id}
