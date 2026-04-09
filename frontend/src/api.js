const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Upload a PDF resume — returns { data: { raw_text, word_count } }
export async function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload-resume`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

// Generate questions — returns { session_id, questions: [{question_id, order, text}] }
export async function generateQuestions(resumeText, jobRole, difficulty = "medium") {
  const res = await fetch(`${BASE_URL}/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, job_role: jobRole, difficulty }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Question generation failed");
  }
  return res.json();
}

// Submit an answer — returns { question, evaluation: { score, verdict, feedback } }
export async function submitAnswer(questionId, userAnswer) {
  const res = await fetch(`${BASE_URL}/submit-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id: questionId, user_answer: userAnswer }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Submission failed");
  }
  return res.json();
}

// Get full results for a session
export async function getSessionResults(sessionId) {
  const res = await fetch(`${BASE_URL}/session/${sessionId}/results`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Could not fetch results");
  }
  return res.json();
}
