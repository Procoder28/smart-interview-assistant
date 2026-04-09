from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from parser import parse_resume
from question_generator import generate_questions
from evaluator import evaluate_answer
from database import engine, get_db, Base
from models import Session as InterviewSession, Question, Answer
from sqlalchemy.orm import Session as DBSession

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Interview Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://smart-interview-assistant-procoder28s-projects.vercel.app",
                   "https://smart-interview-assistant-sage.vercel.app"
                   "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    """Health check — just to confirm the server is running."""
    return {"message": "Smart Interview Assistant API is running!"}


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Accepts a PDF file, saves it temporarily,
    parses it, then deletes the temp file.
    """
    
    # 1. Validate that the uploaded file is a PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    
    # 2. Save the file temporarily on the server
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 3. Parse the saved PDF
    try:
        result = parse_resume(temp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")
    finally:
        # 4. Always delete the temp file, even if parsing fails
        if os.path.exists(temp_path):
            os.remove(temp_path)
    
    # 5. Return the result
    return {
        "filename": file.filename,
        "status": "success",
        "data": result
    }

class QuestionRequest(BaseModel):
    resume_text: str
    job_role: str
    difficulty: str = "medium"   # NEW — allows user to specify difficulty level

# --- NEW: Question generation endpoint ---
@app.post("/generate-questions")
async def generate_interview_questions(
    request: QuestionRequest,
    db: DBSession = Depends(get_db)    # DB session injected automatically
    ):
    """
    Receives resume text + job role, returns 5 interview questions.
    """
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty.")
    
    if not request.job_role.strip():
        raise HTTPException(status_code=400, detail="Job role cannot be empty.")
    if request.difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(status_code=400, detail="Difficulty must be 'easy', 'medium', or 'hard'.")
    try:
        questions = generate_questions(request.resume_text, request.job_role, request.difficulty)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

     # Save session to DB
    session = InterviewSession(
        job_role=request.job_role,
        resume_text=request.resume_text
    )
    db.add(session)
    db.commit()
    db.refresh(session)   # loads the auto-generated session.id

    # Save each question to DB
    db_questions = []
    for i, q_text in enumerate(questions):
        q = Question(
            session_id=session.id,
            text=q_text,
            order_num=i + 1
        )
        db.add(q)
        db_questions.append(q)

    db.commit()

    # Refresh to get auto-generated IDs
    for q in db_questions:
        db.refresh(q)

    return {
        "session_id": session.id,
        "job_role": request.job_role,
        "difficulty": request.difficulty,
        "questions": [
            {"question_id": q.id, "order": q.order_num, "text": q.text}
            for q in db_questions
        ],
        "count": len(db_questions)
    }


# NEW — Answer submission model
class AnswerRequest(BaseModel):
    question_id: int
    user_answer: str

# NEW — Answer evaluation endpoint
@app.post("/submit-answer")
async def submit_answer(
    request: AnswerRequest,
    db: DBSession = Depends(get_db)
):
    """
    Takes a question and the user's answer.
    Returns a score (0-10), verdict, feedback, and missing concepts.
    """
    if not request.user_answer.strip():
        raise HTTPException(status_code=404, detail="Answer cannot be empty.")
    
    # Look up the question from DB
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")
    try:
        result = evaluate_answer(question.text, request.user_answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

        # Save answer + evaluation to DB
    answer = Answer(
        question_id=request.question_id,
        user_answer=request.user_answer,
        score=result["score"],
        verdict=result["verdict"],
        feedback=result["feedback"],
        missing_concepts=", ".join(result.get("missing_concepts", [])),
        ideal_answer_summary=result.get("ideal_answer_summary"),
        communication_tip=result.get("communication_tip"),
        follow_up_question=result.get("follow_up_question")
    )
    db.add(answer)
    db.commit()

    return {
        "question": question.text,
        "evaluation": result
    }

# ─── Get Session Results ──────────────────────────────────────
@app.get("/session/{session_id}/results")
def get_session_results(session_id: int, db: DBSession = Depends(get_db)):
    """
    Returns all questions + answers + scores for a completed session.
    Great for building a results/feedback dashboard later.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    results = []
    total_score = 0
    answered = 0

    for q in session.questions:
        entry = {
            "question_id": q.id,
            "order": q.order_num,
            "question": q.text,
            "answer": None,
            "score": None,
            "verdict": None,
            "feedback": None,
            "missing_concepts": []
        }
        if q.answer:
            entry["answer"]           = q.answer.user_answer
            entry["score"]            = q.answer.score
            entry["verdict"]          = q.answer.verdict
            entry["feedback"]         = q.answer.feedback
            entry["missing_concepts"] = q.answer.missing_concepts.split(", ") if q.answer.missing_concepts else []
            entry["ideal_answer_summary"] = q.answer.ideal_answer_summary
            entry["communication_tip"] = q.answer.communication_tip
            entry["follow_up_question"] = q.answer.follow_up_question
            total_score += q.answer.score
            answered += 1

        results.append(entry)

    return {
        "session_id": session_id,
        "job_role": session.job_role,
        "created_at": session.created_at,
        "total_questions": len(session.questions),
        "answered": answered,
        "average_score": round(total_score / answered, 2) if answered > 0 else 0,
        "results": results
    }
