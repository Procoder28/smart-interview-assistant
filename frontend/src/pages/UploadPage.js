import { useState } from "react";
import { uploadResume, generateQuestions } from "../api";

const DIFFICULTIES = [
  { value: "easy",   label: "Easy",   desc: "Foundational concepts, great for freshers" },
  { value: "medium", label: "Medium", desc: "Practical scenarios, 1-3 years experience" },
  { value: "hard",   label: "Hard",   desc: "System design and deep dives, senior level" },
];

export default function UploadPage({ onStart }) {
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    if (!file) return setError("Please select a PDF file.");
    if (!jobRole.trim()) return setError("Please enter a job role.");

    setLoading(true);
    setError("");

    try {
      // Step 1: parse the PDF
      const uploadResult = await uploadResume(file);
      const resumeText = uploadResult.data.raw_text;

      // Step 2: generate questions
      const questionData = await generateQuestions(resumeText, jobRole, difficulty);

      // Pass data up to App.js to switch page
      onStart(questionData, resumeText);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "40px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <h2 style={{ marginTop: 0, fontSize: "22px", fontWeight: 500 }}>Start your interview</h2>
      <p style={{ color: "#666", marginBottom: "32px" }}>
        Upload your resume and select a job role. We'll generate 5 tailored interview questions for you.
      </p>

      {/* File upload */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
          Resume (PDF)
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
        />
        {file && (
          <p style={{ marginTop: "6px", color: "#4caf50", fontSize: "14px" }}>
            Selected: {file.name}
          </p>
        )}
      </div>

      {/* Job role input */}
      <div style={{ marginBottom: "28px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
          Job role
        </label>
        <input
          type="text"
          placeholder="e.g. Backend Developer, Data Scientist, Frontend Engineer"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }}
        />
      </div>

      {/* Difficulty selector */}
      <div style={{ marginBottom: "28px" }}>
        <label style={{ display: "block", marginBottom: "12px", fontWeight: 500 }}>Difficulty</label>
        <div style={{ display: "flex", gap: "12px" }}>
          {DIFFICULTIES.map((d) => (
            <div
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              style={{
                flex: 1, padding: "14px", borderRadius: "8px", cursor: "pointer",
                border: difficulty === d.value ? "2px solid #1a1a2e" : "2px solid #ddd",
                background: difficulty === d.value ? "#f0f0f8" : "white",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: "4px" }}>{d.label}</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.4 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Error message */}
      {error && (
        <p style={{ color: "#e53935", marginBottom: "16px" }}>{error}</p>
      )}

      {/* Submit button */}
      <button
        onClick={handleStart}
        disabled={loading}
        style={{ width: "100%", padding: "14px", background: loading ? "#999" : "#1a1a2e", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Preparing your interview..." : "Start Interview"}
      </button>
    </div>
  );
}