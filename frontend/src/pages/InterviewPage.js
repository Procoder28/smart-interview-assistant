import { useState, useCallback } from "react";
import { submitAnswer } from "../api";
import { useTTS, useSTT } from "../hooks/useSpeech";

export default function InterviewPage({ sessionData, onFinish }) {
  const questions = sessionData.questions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [followUpDone, setFollowUpDone] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showIdeal, setShowIdeal] = useState(false);

  // TTS hook — for reading questions aloud
  const { speak, stop, speaking } = useTTS();

  // STT hook — useCallback so the reference stays stable across renders
  const handleTranscript = useCallback((transcript) => {
    setAnswer(transcript);
  }, []);
  const { startListening, stopListening, listening, supported: micSupported } = useSTT({
    onResult: handleTranscript,
  });

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  async function handleSubmit() {
    if (!answer.trim()) return setError("Please write or speak an answer.");
    stop();          // stop TTS if still speaking
    stopListening(); // stop mic if still open
    setLoading(true);
    setError("");
    try {
      const result = await submitAnswer(currentQuestion.question_id, answer);
      setFeedback(result.evaluation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    stop();
    stopListening();
    setAnswer("");
    setFeedback(null);
    setFollowUpAnswer("");
    setFollowUpDone(false);
    setShowIdeal(false);
    setError("");
    if (isLastQuestion) {
      onFinish();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function scoreColor(score) {
    if (score >= 8) return "#4caf50";
    if (score >= 5) return "#ff9800";
    return "#e53935";
  }

  const card = {
    background: "white",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  };

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "14px", color: "#666" }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span style={{ fontSize: "14px", color: "#666" }}>{sessionData.job_role}</span>
        </div>
        <div style={{ background: "#e0e0e0", borderRadius: "4px", height: "6px" }}>
          <div style={{
            background: "#1a1a2e", height: "6px", borderRadius: "4px",
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Question card */}
      <div style={card}>
        <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginTop: 0 }}>
          Question {currentIndex + 1}
        </p>
        <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 500, lineHeight: 1.5 }}>
          {currentQuestion.text}
        </h2>

        {/* TTS button — read question aloud */}
        <button
          onClick={() => speaking ? stop() : speak(currentQuestion.text)}
          style={{
            marginBottom: "24px",
            padding: "8px 18px",
            background: speaking ? "#ff9800" : "#f0f0f0",
            color: speaking ? "white" : "#333",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {speaking ? "Stop speaking" : "Read question aloud"}
        </button>

        {/* Answer area */}
        {!feedback && (
          <>
            <textarea
              rows={6}
              placeholder={listening ? "Listening... speak your answer" : "Type your answer or use the mic below..."}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: listening ? "2px solid #7c4dff" : "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "15px",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.6,
                transition: "border 0.2s",
              }}
            />

            {/* Mic controls */}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px", alignItems: "center" }}>
              {micSupported ? (
                <>
                  <button
                    onClick={listening ? stopListening : startListening}
                    style={{
                      padding: "10px 20px",
                      background: listening ? "#e53935" : "#7c4dff",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {/* Simple mic icon using unicode */}
                    {listening ? "⏹ Stop mic" : "🎤 Speak answer"}
                  </button>
                  {listening && (
                    <span style={{ fontSize: "13px", color: "#7c4dff", animation: "pulse 1s infinite" }}>
                      Recording...
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: "13px", color: "#999" }}>
                  Voice input not supported in this browser. Use Chrome or Edge.
                </span>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  marginLeft: "auto",
                  padding: "10px 28px",
                  background: loading ? "#999" : "#1a1a2e",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Evaluating..." : "Submit Answer"}
              </button>
            </div>

            {error && <p style={{ color: "#e53935", marginTop: "8px" }}>{error}</p>}
          </>
        )}

        {/* Feedback panel */}
        {feedback && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ fontSize: "36px", fontWeight: 500, color: scoreColor(feedback.score) }}>
                {feedback.score}/10
              </div>
              <span style={{ padding: "4px 12px", borderRadius: "20px", background: scoreColor(feedback.score), color: "white", fontSize: "13px" }}>
                {feedback.verdict}
              </span>
            </div>

            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#444" }}>
                {feedback.feedback}
              </p>
            </div>

            {feedback.communication_tip && (
              <div style={{ background: "#e8f5e9", padding: "12px 16px", marginBottom: "16px", borderLeft: "3px solid #4caf50", borderRadius: "0 8px 8px 0" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#2e7d32" }}>
                  <strong>Communication tip:</strong> {feedback.communication_tip}
                </p>
              </div>
            )}

            {feedback.missing_concepts && feedback.missing_concepts.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: "#666" }}>
                  Topics to study:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {feedback.missing_concepts.map((c, i) => (
                    <span key={i} style={{ padding: "4px 12px", background: "#fff3e0", color: "#e65100", borderRadius: "20px", fontSize: "13px" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {feedback.ideal_answer_summary && (
              <div style={{ marginBottom: "16px" }}>
                <button
                  onClick={() => setShowIdeal((v) => !v)}
                  style={{ background: "none", border: "1px solid #ddd", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", color: "#555" }}
                >
                  {showIdeal ? "Hide ideal answer" : "Show ideal answer"}
                </button>
                {showIdeal && (
                  <div style={{ marginTop: "12px", background: "#e3f2fd", borderRadius: "8px", padding: "16px", borderLeft: "3px solid #1976d2" }}>
                    <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#1a237e" }}>
                      {feedback.ideal_answer_summary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {feedback.follow_up_question && !followUpDone && (
              <div style={{ marginBottom: "16px", border: "1px solid #ce93d8", borderRadius: "8px", padding: "20px", background: "#fce4ec" }}>
                <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "#880e4f" }}>
                  Follow-up question
                </p>
                <p style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 500, color: "#4a148c" }}>
                  {feedback.follow_up_question}
                </p>
                <textarea
                  rows={4}
                  placeholder="Answer the follow-up (optional but good practice)..."
                  value={followUpAnswer}
                  onChange={(e) => setFollowUpAnswer(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ce93d8", borderRadius: "8px", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }}
                />
                <button
                  onClick={() => setFollowUpDone(true)}
                  style={{ marginTop: "10px", padding: "8px 20px", background: "#6a1b9a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}
                >
                  Done
                </button>
              </div>
            )}

            {(!feedback.follow_up_question || followUpDone) && (
              <button
                onClick={handleNext}
                style={{ padding: "12px 32px", background: "#1a1a2e", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer" }}
              >
                {isLastQuestion ? "See Final Results" : "Next Question"}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}