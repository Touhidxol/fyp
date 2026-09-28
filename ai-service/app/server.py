from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .generate_test import generate_test_for_request

app = FastAPI()


@app.get("/")
def root():
    return {"status": "Server is up and running"}


# @app.post("/chat")
# def chat(query: str = Query(..., description="The chat query of user")):
#     job = queue.enqueue(process_query, query)

#     return {"status": "queued", "job_id": job.id}


class GenerateTestRequest(BaseModel):
    notebook_id: str = Field(..., description="Notebook to fetch chunks from", examples=["0001"])
    query: str = Field(..., description="What kind of test to generate", examples=["20 mark test on eigenvalues"])

@app.post("/generate-test")
def generate_test_endpoint(body: GenerateTestRequest):
    try:
        return generate_test_for_request(body.query, body.notebook_id)
    except ValueError as e:
        raise HTTPException(404, str(e))

