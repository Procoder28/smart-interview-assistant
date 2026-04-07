import { useState, useEffect } from "react";
import { getSessionResults } from "../api";

export default function ResultsPage({ sessionId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSessionResults(sessionId)
      .then(setResults)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  function scoreColor(score) {
    if (score >= 8) return "#4caf50";
    if (score >= 5) return "#ff9800";
    return "#e53935";
  }

  if (loading) return <p style={{ textAlign: "center", color: "#666" }}>Loading your results...</p>;
  if (error) return <p style={{ textAlign: "center", color: "#e53935" }}>{error}</p>;

  return (
    <div>
      {/* Summary card */}
      <div style={{ background: "#1a1a2e", color: "white", borderRadius: "12px", padding: "32px", marginBottom: "24px", textAlign: "center" }}>
        <p style={{ margin: "0 0 8px", fontSize: "14px", opacity: 0.7 }}>
          {results.job_role} — Interview Complete
        </p>
        <div style={{ fontSize: "56px", fontWeight: 500, color: scoreColor(results.average_score) }}>
          {results.average_score}/10
        </div>
        <p style={{ margin: "8px 0 0", opacity: 0.7 }}>
          Average score across {results.answered} questions
        </p>
      </div>

      {/* Per-question breakdown */}
      {results.results.map((item, i) => (
        <div key={i} style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: "16px", lineHeight: 1.5, flex: 1, paddingRight: "16px" }}>
              Q{item.order}. {item.question}
            </p>
            {item.score !== null && (
              <span style={{ fontSize: "20px", fontWeight: 500, color: scoreColor(item.score), whiteSpace: "nowrap" }}>
                {item.score}/10
              </span>
            )}
          </div>

          {item.answer && (
            <>
              <p style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>Your answer</p>
              <p style={{ background: "#f5f5f5", borderRadius: "8px", padding: "12px", fontSize: "14px", color: "#444", lineHeight: 1.6, marginBottom: "12px" }}>
                {item.answer}
              </p>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, marginBottom: "12px" }}>
                {item.feedback}
              </p>
              {item.missing_concepts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {item.missing_concepts.map((c, j) => (
                    <span key={j} style={{ padding: "4px 12px", background: "#fff3e0", color: "#e65100", borderRadius: "20px", fontSize: "13px" }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Restart button */}
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "14px 40px", background: "#1a1a2e", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}
        >
          Start a new interview
        </button>
      </div>
    </div>
  );
}