import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import BASE_URL from "../api";

const api = axios.create({
  baseURL: `${BASE_URL}/api`
});

const moduleTiles = [
  {
    title: "Program / Project Tracking",
    color: "#6ae3ff",
    points: [
      "Portfolio view with R/Y/G health",
      "Gantt milestones & stage gates",
      "BOM/ECO version trail + approvals"
    ]
  },
  {
    title: "Production Visibility",
    color: "#7cfaa0",
    points: ["Line assignment & WIP load", "First pass yield, rework & scrap", "Capacity vs. constraints by station"]
  },
  {
    title: "Quality & Compliance",
    color: "#ffb86b",
    points: ["NCR/CAPA with 8D & fishbone", "SPC charts, Cp/Cpk, OOC alerts", "Audit packs: PPAP, ISO, FDA/NDACAP"]
  },
  {
    title: "Supply Chain & Materials",
    color: "#8ad6ff",
    points: ["PO status, ETA heatmap, scorecards", "Inventory accuracy, min/max, BIN drill", "Lead-time trends + risk flags"]
  },
  {
    title: "After-Sales & RMA",
    color: "#f77979",
    points: ["Self-service returns with codes", "Repair cycle analytics, spare parts", "Failure trend & diagnostics log"]
  },
  {
    title: "Collaboration & Docs",
    color: "#c2a7ff",
    points: ["Threaded reviews w/ attachments", "3D CAD/BoM availability matrix", "Shareable evidence/export bundles"]
  }
];

const navItems = [
  { label: "Overview", icon: "🏠", href: "#overview" },
  { label: "Projects", icon: "📋", href: "#projects" },
  { label: "Quality", icon: "✅", href: "#quality" },
  { label: "Supply Chain", icon: "🚚", href: "#supply" },
  { label: "After-Sales", icon: "🛠️", href: "#service" },
  { label: "Collab & Docs", icon: "📎", href: "#collab" },
  { label: "Alerts", icon: "🔔", href: "#alerts" },
  { label: "History", icon: "🕒", href: "#history" }
];

export default function Dashboard() {
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState("In Progress");
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [scope, setScope] = useState("all");
  const [downloadMsg, setDownloadMsg] = useState("");
  const [historyMsg, setHistoryMsg] = useState("");
  const role = localStorage.getItem("role") || "viewer";
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user") || "Factory User";

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const getColor = (status) => {
    if (status === "Done") return "#42ffb2";
    if (status === "In Progress") return "#ffd66b";
    return "#ff7b7b";
  };

  const fetchProjects = async () => {
    const ownerParam =
      scope === "mine" ? `?owner=${encodeURIComponent(user)}` : "";
    const res = await api.get(`/projects${ownerParam}`, authHeader);
    setProjects(res.data);
  };

  const createProject = async () => {
    if (!newTitle.trim()) return;
    await api.post(
      "/projects",
      { title: newTitle, status: newStatus, owner: user },
      authHeader
    );
    setNewTitle("");
    setNewStatus("In Progress");
    fetchProjects();
  };

  const searchProjects = async () => {
    const res = await api.get(
      `/projects/search?query=${encodeURIComponent(search)}${
        scope === "mine" ? `&owner=${encodeURIComponent(user)}` : ""
      }`,
      authHeader
    );
    setProjects(res.data);
  };

  const updateStatus = async (id, status) => {
    await api.put(`/projects/${id}`, { status }, authHeader);
    fetchProjects();
  };

  const deleteProject = async (id) => {
    if (!id) return;
    try {
      await api.delete(`/projects/${id}`, authHeader);
      fetchProjects();
    } catch (err) {
      setDownloadMsg("Delete failed. Please retry after refresh.");
      setTimeout(() => setDownloadMsg(""), 2000);
    }
  };

  const downloadPack = async (id, title) => {
    const res = await api.get(`/projects/${id}/package`, {
      ...authHeader,
      responseType: "blob"
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}-evidence-pack.txt`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    setDownloadMsg("Evidence pack downloaded.");
    setTimeout(() => setDownloadMsg(""), 2000);
  };

  const clearHistoryEntry = async (id) => {
    try {
      await api.delete(`/logs/${id}`, authHeader);
      const fresh = await api.get("/logs", authHeader);
      setLogs(fresh.data);
      setHistoryMsg("Entry deleted.");
      setTimeout(() => setHistoryMsg(""), 2000);
    } catch (e) {
      setHistoryMsg("Unable to delete entry.");
      setTimeout(() => setHistoryMsg(""), 2000);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProjects();
    api.get("/logs", authHeader).then((res) => setLogs(res.data));
    api.get("/notifications", authHeader).then((res) => {
      const base = res.data || [];
      // derive event-triggered alerts for At Risk, expiring, ECO changes
      const riskAlerts = projects
        .filter((p) => p.status === "At Risk")
        .map((p) => ({ message: `Delay/quality alert on ${p.title}` }));
      setNotifications([...riskAlerts, ...base]);
    });
  }, [scope, projects.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = useMemo(() => {
    const total = projects.length || 1;
    const done = projects.filter((p) => p.status === "Done").length;
    const atRisk = projects.filter((p) => p.status === "At Risk").length;
    const inProgress = projects.filter((p) => p.status === "In Progress").length;

    return [
      {
        label: "On-time delivery",
        value: `${Math.round((done / total) * 100)}%`,
        delta: done ? "+ tracking" : "– seed data"
      },
      {
        label: "First-pass yield",
        value: `${Math.max(70, 90 - atRisk * 3)}%`,
        delta: atRisk ? "- impacted" : "+ stable"
      },
      {
        label: "Capacity utilized",
        value: `${Math.min(99, 70 + inProgress * 4)}%`,
        delta: inProgress > 3 ? "+ load" : "- slack"
      },
      {
        label: "Open NCR/CAPA",
        value: `${Math.max(0, atRisk * 3 || 2)}`,
        delta: atRisk ? `+${atRisk}` : "-2"
      }
    ];
  }, [projects]);

  const statusGraph = useMemo(() => {
    const total = projects.length || 1;
    const done = projects.filter((p) => p.status === "Done").length;
    const atRisk = projects.filter((p) => p.status === "At Risk").length;
    const inProgress = projects.filter((p) => p.status === "In Progress").length;
    return [
      { label: "Done", value: done, pct: Math.round((done / total) * 100), className: "seg-done" },
      { label: "In Progress", value: inProgress, pct: Math.round((inProgress / total) * 100), className: "seg-progress" },
      { label: "At Risk", value: atRisk, pct: Math.round((atRisk / total) * 100), className: "seg-risk" }
    ];
  }, [projects]);

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="logo-chip">FactoryIQ</div>
        <nav className="side-links">
          {navItems.map((item) => (
            item.isRoute ? (
              <Link key={item.label} to={item.href} className="side-link">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="side-link">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            )
          ))}
        </nav>
        <div className="side-footer">
          <div className="avatar small">{user?.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user}</strong>
            <div className="muted">{role}</div>
          </div>
        </div>
      </aside>

      <div className="dashboard dark-theme">
        <div className="navbar">
          <div className="nav-brand">Operational Pulse</div>
          <div className="nav-actions">
            <button className="ghost">Export view</button>
            <button
              className="ghost"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <header className="topbar" id="overview">
          <div>
            <div className="pill tiny-pill">FactoryIQ Control Tower</div>
            <h1>Operational Pulse</h1>
            <p className="muted">
              Portfolio health, supply chain ETA, quality controls, and
              collaboration — all in one command view.
            </p>
          </div>
          <div className="user-chip">
            <div className="avatar">{user?.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{user}</strong>
              <div className="muted">{role}</div>
            </div>
          </div>
        </header>

        <section className="kpi-row">
          {metrics.map((kpi) => (
            <div key={kpi.label} className="card kpi-card rise-in">
              <p className="muted">{kpi.label}</p>
              <div className="kpi-value">{kpi.value}</div>
              <span className="delta">{kpi.delta}</span>
            </div>
          ))}
        </section>

        <section className="panel-grid" id="projects">
          <div className="card hero-card">
            <div className="hero-text">
              <p className="pill">Program / Project Tracking</p>
              <h2>Stage gates, ECOs, and execution clarity.</h2>
              <p className="muted">
                Live drill-down with R/Y/G health, shift performance, and
                traceable sign-offs across R&D → NPI → Production.
              </p>
              <div className="badge-row">
                <span className="badge">Gantt</span>
                <span className="badge">BOM/ECO trail</span>
                <span className="badge">Audit-ready</span>
              </div>
            </div>
            <div className="chart-placeholder">
              <div className="timeline-label">Portfolio mix by status</div>
              <div className="chart-bars">
                {statusGraph.map((seg) => (
                  <div key={seg.label} className="chart-row">
                    <div className="muted">{seg.label}</div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${seg.className}`}
                        style={{ width: `${seg.pct}%` }}
                      />
                    </div>
                    <div className="muted">{seg.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card actions-card">
            <div className="input-stack">
              <input
                className="input"
                placeholder="Search projects, ECOs, parts..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="scope-toggle">
                <button
                  className={scope === "all" ? "role-btn active" : "role-btn"}
                  onClick={() => setScope("all")}
                >
                  All programs
                </button>
                <button
                  className={scope === "mine" ? "role-btn active" : "role-btn"}
                  onClick={() => setScope("mine")}
                >
                  My queue
                </button>
              </div>
              <div className="action-row">
                <button className="ghost" onClick={searchProjects}>
                  Search
                </button>
                {role === "admin" ? (
                  <>
                    <input
                      className="input"
                      placeholder="New project title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <select
                      className="input"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option>In Progress</option>
                      <option>Done</option>
                      <option>At Risk</option>
                    </select>
                    <button className="primary" onClick={createProject}>
                      Add project
                    </button>
                  </>
                ) : (
                  <div className="ghost disabled-tip">
                    Member view (create is admin-only)
                  </div>
                )}
              </div>
            </div>
            <div className="mini-grid">
              {projects.slice(0, 3).map((p) => (
                <div key={p._id} className="mini-card">
                  <div className="mini-title">{p.title}</div>
                  <div className="mini-meta">
                    <span style={{ color: getColor(p.status) }}>{p.status}</span>
                    <span className="muted">Owner · {p.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      <section className="module-grid" id="quality">
        {moduleTiles.map((m) => (
          <div key={m.title} className="card module-card fade-in">
            <h3 style={{ color: m.color }}>{m.title}</h3>
            <ul>
              {m.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            </div>
          ))}
        </section>

        <section className="data-panels" id="alerts">
          <div className="card list-card">
            <div className="card-head">
              <h3>Projects & Operations</h3>
              <span className="muted">Live from Mongo</span>
            </div>
            <div className="table">
              <div className="table-head">
                <span>Title</span>
                <span>Status</span>
                <span>Owner</span>
                <span>Actions</span>
              </div>
              {projects.map((p) => (
                <div key={p._id} className="table-row">
                  <span>{p.title}</span>
                  {role === "admin" ? (
                    <select
                      className="inline-select"
                      value={p.status}
                      onChange={(e) => updateStatus(p._id, e.target.value)}
                    >
                      <option>In Progress</option>
                      <option>Done</option>
                      <option>At Risk</option>
                    </select>
                  ) : (
                    <span style={{ color: getColor(p.status) }}>{p.status}</span>
                  )}
                  <span>{p.owner}</span>
                  {role === "admin" ? (
                    <div className="action-buttons">
                      <button
                        className="ghost"
                        onClick={() => downloadPack(p._id, p.title)}
                      >
                        Evidence
                      </button>
                      <button
                      className="ghost danger"
                      onClick={() => deleteProject(p._id)}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>
                ) : (
                  <span className="muted">view only</span>
                )}
                </div>
              ))}
            </div>
            {downloadMsg && <div className="alert alert-ok">{downloadMsg}</div>}
          </div>

          <div className="card list-card" id="alerts">
            <div className="card-head">
              <h3>Activity & Alerts</h3>
              <span className="muted">{logs.length} events · {notifications.length} notices</span>
            </div>
            <div className="stacked">
              {notifications.slice(0, 5).map((n) => (
                <div key={n._id || n.message} className="alert-card">
                  <div className="badge ghost-badge">Notice</div>
                  <div>{n.message}</div>
                </div>
              ))}
              {logs.slice(0, 5).map((l) => (
                <div key={l._id} className="alert-card">
                  <div className="badge ghost-badge">{l.user || "system"}</div>
                  <div>{l.action}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card list-card" id="history">
            <div className="card-head">
              <div>
                <h3>History</h3>
                <span className="muted">Recent adds/edits/deletes</span>
              </div>
            </div>
            <div className="stacked">
              {logs.slice(0, 12).map((l) => (
                <div key={l._id} className="alert-card">
                  <div className="history-left">
                    <div className="badge ghost-badge">Log</div>
                    <div>
                      <div>
                        {l.action}
                        {l.projectTitle && <strong> · {l.projectTitle}</strong>}
                        {l.status && <span className="muted"> ({l.status})</span>}
                        {l.user && <span className="muted"> · by {l.user}</span>}
                      </div>
                      <div className="muted small-text">
                        {new Date(l.timestamp || l.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </div>
                  {role === "admin" && (
                    <button className="ghost danger" onClick={() => clearHistoryEntry(l._id)}>
                      🗑️
                    </button>
                  )}
                </div>
              ))}
              {logs.length === 0 && <div className="muted">No history yet.</div>}
            </div>
            {historyMsg && <div className="alert alert-ok">{historyMsg}</div>}
          </div>
        </section>

        <footer className="site-footer">
          © 2026 AdarshBoja · FactoryIQ Manufacturing Excellence Portal
        </footer>
      </div>
    </div>
  );
}
