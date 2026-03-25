import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
});

export default function History() {
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    api.get("/logs", authHeader).then((res) => setLogs(res.data));
  }, [token]);

  return (
    <div className="history-page">
      <header className="history-hero">
        <div className="pill tiny-pill">Audit log</div>
        <h1>Portfolio history</h1>
        <p className="muted">Creates, updates, deletes with date/time and user.</p>
      </header>

      <div className="history-grid">
        {logs.map((l) => (
          <div key={l._id} className="history-card">
            <div className="history-action">{l.action}</div>
            <div className="history-meta muted">
              {new Date(l.timestamp || l.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
