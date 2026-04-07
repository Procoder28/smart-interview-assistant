import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import InterviewPage from "./pages/InterviewPage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  const [page, setPage] = useState("upload");
  const [sessionData, setSessionData] = useState(null);   // { session_id, questions }
  const [resumeText, setResumeText] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1a1a2e", color: "white", padding: "16px 32px" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 500 }}>
          Smart Interview Assistant
        </h1>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: "760px", margin: "40px auto", padding: "0 20px" }}>

        {page === "upload" && (
          <UploadPage
            onStart={(data, text) => {
              setSessionData(data);
              setResumeText(text);
              setPage("interview");
            }}
          />
        )}

        {page === "interview" && (
          <InterviewPage
            sessionData={sessionData}
            onFinish={() => setPage("results")}
          />
        )}

        {page === "results" && (
          <ResultsPage sessionId={sessionData.session_id} />
        )}

      </div>
    </div>
  );
}