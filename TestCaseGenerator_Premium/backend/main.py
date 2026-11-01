from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import sys
import os

# Add the parent directory to sys.path to import tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.model_logic import generate_test_cases_from_ai

app = FastAPI(title="AI Test Case Generator API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from the frontend directory
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

class TestCaseRequest(BaseModel):
    user_story: str

@app.get("/")
def read_root():
    return {"message": "AI Test Case Generator Backend is running."}

@app.post("/generate")
async def generate_test_cases(request: TestCaseRequest):
    if not request.user_story.strip():
        raise HTTPException(status_code=400, detail="User story cannot be empty.")
    
    result = generate_test_cases_from_ai(request.user_story)
    return {"test_cases": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
