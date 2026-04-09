import google.generativeai as genai
import json
import re
import os

api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("Missing API key: set GOOGLE_API_KEY or GEMINI_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

DIFFICULTY_INSTRUCTIONS = {
    "easy": (
        "Questions should be straightforward and foundational. "
        "Focus on basic definitions, simple use cases, and beginner-level concepts. "
        "Suitable for someone with less than 1 year of experience."
    ),
    "medium": (
        "Questions should test practical understanding. "
        "Include scenario-based questions, trade-offs, and real-world application. "
        "Suitable for someone with 1-3 years of experience."
    ),
    "hard": (
        "Questions should be challenging and deep. "
        "Include system design thinking, edge cases, performance considerations, and architecture decisions. "
        "Suitable for a senior engineer with 3+ years of experience."
    ),
}


def build_prompt(resume_text: str, job_role: str, difficulty: str) -> str:
    level_instruction = DIFFICULTY_INSTRUCTIONS.get(difficulty, DIFFICULTY_INSTRUCTIONS["medium"])

    prompt = f"""
You are an expert technical interviewer.

Based on the resume below and the job role "{job_role}", generate exactly 5 interview questions.

Difficulty level: {difficulty.upper()}
{level_instruction}

Rules:
- Questions must be specific to the candidate's actual skills and experience
- Mix technical and behavioural questions
- Each question should be different in type (concept, project-based, problem-solving, behavioural, situational)
- Return ONLY a valid JSON array of 5 strings, nothing else

Resume:
{resume_text}

Return format (JSON array only, no extra text):
["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
"""
    return prompt


def generate_questions(resume_text: str, job_role: str, difficulty: str = "medium") -> list[str]:
    prompt = build_prompt(resume_text, job_role, difficulty)
    response = model.generate_content(prompt)
    raw_text = response.text.strip()
    cleaned = re.sub(r"```json|```", "", raw_text).strip()
    questions = json.loads(cleaned)
    if not isinstance(questions, list):
        raise ValueError("Gemini did not return a list of questions")
    return questions

# import google.generativeai as genai
# import os
# import json
# import re

# # Configure the Gemini API with your key
# # genai.configure(api_key=os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY"))

# # Load the model — gemini-1.5-flash is fast and free
# model = genai.GenerativeModel("gemini-2.5-flash")


# def build_prompt(resume_text: str, job_role: str) -> str:
#     """
#     Builds the prompt we send to Gemini.
#     This is the most important function — good prompt = good questions.
#     """
#     prompt = f"""
# You are an expert technical interviewer.

# Based on the resume below and the job role "{job_role}", generate exactly 5 interview questions.

# Rules:
# - Questions must be specific to the candidate's actual skills and experience
# - Mix technical and behavioural questions
# - Each question should be different in type (e.g., concept, project, problem-solving)
# - Return ONLY a valid JSON array of 5 strings, nothing else

# Resume:
# {resume_text}

# Return format (JSON array only, no extra text):
# ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
# """
#     return prompt


# def generate_questions(resume_text: str, job_role: str) -> list[str]:
#     """
#     Sends the prompt to Gemini and returns a list of 5 questions.
#     """
#     prompt = build_prompt(resume_text, job_role)

#     # Send to Gemini
#     response = model.generate_content(prompt)
#     raw_text = response.text.strip()

#     # Gemini sometimes wraps response in ```json ... ``` — strip that
#     cleaned = re.sub(r"```json|```", "", raw_text).strip()

#     # Parse the JSON list
#     questions = json.loads(cleaned)

#     # Safety check — make sure we got a list
#     if not isinstance(questions, list):
#         raise ValueError("Gemini did not return a list of questions")

#     return questions
