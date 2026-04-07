import google.generativeai as genai
import json
import re

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY","AIzaSyCipnFYBab-Y5pphSB3es7BMDSzYAYmF_4"))  # same key you used in question_generator.py

model = genai.GenerativeModel("gemini-2.5-flash")


def build_evaluation_prompt(question: str, user_answer: str) -> str:
    """
    Builds the prompt that asks Gemini to act as an interviewer
    and evaluate the candidate's answer.
    """
    prompt = f"""
You are a strict but fair technical interviewer evaluating a candidate's answer.

Question asked: {question}

Candidate's answer: {user_answer}

Evaluate the answer and respond with ONLY a valid JSON object in this exact format:
{{
  "score": <integer from 0 to 10>,
  "verdict": "<one of: Excellent / Good / Average / Poor>",
  "feedback": "<2-3 sentences: what was good, what was missing, what they should improve>",
  "missing_concepts": ["<concept1>", "<concept2>"],
  "ideal_answer_summary": "<brief 2-3 sentence summary of what a perfect answer would include>",
  "communication_tip": "<one sentence tip on how to communicate or structure this answer better>",
  "follow_up_question": "<if score <=5, provide a specific follow-up question to probe deeper; otherwise, set to null>"
}}

Scoring guide:
- 9-10: Complete, accurate, well-explained answer
- 7-8: Mostly correct with minor gaps
- 5-6: Partially correct, missing key points
- 3-4: Vague or mostly incorrect
- 0-2: Off-topic or no real answer

Return ONLY the JSON object. No extra text.
"""
    return prompt

def build_followup_prompt(question: str, user_answer: str) -> str:
    return f"""
You are a technical interviewer. The candidate gave a weak or incomplete answer.

Original question: {question}
Candidate's answer: {user_answer}

Generate exactly ONE sharp follow-up question that:
- Targets the weakest or most missing part of their answer
- Is specific, not generic
- Would help the candidate demonstrate deeper understanding if they know it

Return ONLY the follow-up question as a plain string. No JSON, no explanation.
"""

def evaluate_answer(question: str, user_answer: str) -> dict:
    """
    Sends the question + answer to Gemini and returns structured evaluation.
    """
    prompt = build_evaluation_prompt(question, user_answer)

    response = model.generate_content(prompt)
    raw_text = response.text.strip()

    # Strip markdown code fences if Gemini adds them
    cleaned = re.sub(r"```json|```", "", raw_text).strip()

    result = json.loads(cleaned)

    # Validate expected keys are present
    required_keys = {"score", "verdict", "feedback", "missing_concepts", "ideal_answer_summary", "communication_tip", "follow_up_question"}
    if not required_keys.issubset(result.keys()):
        raise ValueError(f"Gemini response missing keys: {result}")

    return result