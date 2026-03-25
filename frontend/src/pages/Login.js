import { useMemo, useState } from "react";
import axios from "axios";
import BASE_URL from "../api";

const api = axios.create({
  baseURL: `${BASE_URL}/api`
});

export default function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showPassword, setShowPassword] = useState(false);

  const headline = useMemo(
    () =>
      mode === "login"
        ? "Pick up where the factory left off."
        : "Create your FactoryIQ command seat.",
    [mode]
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("info");

const endpoint = mode === "login" ? "/auth/login" : "/auth/register";      const payload =
        mode === "login"
          ? { email, password }
          : { name: name || "Factory Lead", email, password, role };

      const { data } = await api.post(endpoint, payload);

      if (mode === "login") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("user", data.name || name || "Factory User");
        setMessageType("success");
        setMessage("Welcome back. Redirecting...");
        setTimeout(() => (window.location.href = "/dashboard"), 600);
      } else {
        setMode("login");
        setMessageType("success");
        setMessage("Account created. Please sign in.");
      }
    } catch (err) {
      setMessageType("error");
      setMessage(
        err?.response?.data || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="bubble-layer" aria-hidden="true">
        <span className="bubble b1" />
        <span className="bubble b2" />
        <span className="bubble b3" />
        <span className="bubble b4" />
        <span className="bubble b5" />
      </div>
      <div className="auth-nav">
        <div className="nav-logo">FactoryIQ</div>
        <div className="nav-sub">Manufacturing Excellence Portal</div>
      </div>
      <div className="bg-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      <section className="auth-hero">
        <div className="pill pill-hero">Nexgile · FactoryIQ</div>
        <h1 className="typewriter">
          Manufacturing Excellence <br />
          <span className="accent">Portal Control Tower</span>
        </h1>
        <p className="lede">
          End-to-end visibility across R&amp;D, NPI, production, supply chain,
          and after-sales. Built-in quality, compliance, and collaboration
          threads keep every handoff auditable.
        </p>
        <div className="hero-grid hero-two-col">
          {[
            "Program tracking with Gantt, stage gates, and ECO trail",
            "Real-time shop-floor + inventory with live constraints",
            "Quality & compliance: PPAP, NCR/CAPA, SPC, audits",
            "Supply chain ETA heatmaps, risk alerts, and scorecards"
          ].map((item) => (
            <div key={item} className="chip">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="auth-card rise-in">
        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Create account
          </button>
        </div>

        <h2>{headline}</h2>
        <p className="muted">
          Secure, role-aware access with audit-ready trails. Use your work email
          to keep projects and suppliers in sync.
        </p>

        {mode === "signup" && (
          <>
            <input
              className="input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="role-switch">
              <button
                type="button"
                className={role === "admin" ? "role-btn active" : "role-btn"}
                onClick={() => setRole("admin")}
              >
                Admin
              </button>
              <button
                type="button"
                className={role === "member" ? "role-btn active" : "role-btn"}
                onClick={() => setRole("member")}
              >
                Member
              </button>
            </div>
            <div className="tiny muted">
              Admins can create/manage pilots; Members get read/search and alerts.
            </div>
          </>
        )}
        <input
          className="input"
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <div className="input password-wrap">
          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {message && (
          <div className={`alert ${messageType === "success" ? "alert-ok" : ""}`}>
            {message}
          </div>
        )}

        <button className="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Syncing..." : mode === "login" ? "Enter dashboard" : "Create workspace"}
        </button>

        <div className="tiny">
          Single portal for customers, suppliers, and internal teams. Real-time
          telemetry, project evidence packs, and release-ready documents.
        </div>
      </section>
    </div>
  );
}
