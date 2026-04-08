# Smart Interview Assistant

An AI-powered mock interview platform that generates personalised interview 
questions from your resume and evaluates your answers in real time.

## Live Demo
- Frontend: https://smart-interview-assistant.vercel.app
- Backend API: https://smart-interview-assistant-api.onrender.com/docs

## Features
- Resume parsing from PDF
- AI-generated questions tailored to your resume and job role (Gemini 2.5 Flash)
- Three difficulty levels: Easy, Medium, Hard
- Real-time answer evaluation with score, feedback, and missing concepts
- Follow-up questions when answers are weak
- Ideal answer suggestions
- Voice input (speak your answer) and text-to-speech (AI reads questions)
- Session history stored in database

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | FastAPI (Python) |
| AI | Google Gemini 2.5 Flash |
| Database | SQLite + SQLAlchemy |
| Deployment | Vercel (frontend) + Render (backend) |

## Architecture
User → Vercel (React) → Render (FastAPI) → Gemini API
                                          → SQLite DB

## Running Locally
\`\`\`bash
# Backend
cd backend
pip install -r requirements.txt
export GEMINI_API_KEY=your_key
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start
\`\`\`

## Render Deployment
- Set the service root directory to the repository root, or use the root-level Procfile.
- The backend start command runs from `backend/`, which is handled by the Procfile in the repo root.
