import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, FileText, CalendarDays, MessageSquare, UserRound,
  LogOut, PlusCircle, Scale, RefreshCw, Bell, FolderOpen
} from "lucide-react";
import API from "../../services/api";

const toArray = (value) => Array.isArray(value) ? value : [];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [requests, setRequests] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [requestResponse, consultationResponse, messageResponse, notificationResponse] =
        await Promise.all([
          API.get("/workspace/requests"),
          API.get("/workspace/consultations"),
          API.get("/workspace/messages"),
          API.get("/collaboration/notifications"),
        ]);

      setRequests(toArray(requestResponse.data?.requests));
      setConsultations(toArray(consultationResponse.data?.consultations));
      setMessages(toArray(messageResponse.data?.messages));
      setNotifications(toArray(notificationResponse.data?.notifications));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load dashboard data. Please check that the API server is running."
      );
      // Keep the dashboard usable even if one endpoint is temporarily unavailable.
      setRequests([]);
      setConsultations([]);
      setMessages([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // Each menu item is a three-element array: label, route, icon component.
  const menu = [
    ["Dashboard", "/client/dashboard", LayoutDashboard],
    ["My Legal Requests", "/client/requests", FileText],
    ["Consultations", "/client/consultations", CalendarDays],
    ["Messages", "/client/messages", MessageSquare],
    ["Profile", "/client/profile", UserRound],
    ["Documents", "/client/documents", FolderOpen],
    ["Deadlines", "/client/deadlines", CalendarDays],
    ["Notifications", "/client/notifications", Bell],
  ];

  const upcomingConsultations = useMemo(
    () => consultations.filter((item) =>
      item?.scheduled_at &&
      new Date(item.scheduled_at) >= new Date() &&
      item.status !== "cancelled"
    ).length,
    [consultations]
  );

  const unreadMessages = useMemo(
    () => messages.filter((item) =>
      Number(item?.recipient_id) === Number(user?.id) && !item?.read_at
    ).length,
    [messages, user?.id]
  );

  const unreadNotifications = notifications.filter((item) => !item?.read_at).length;

  return (
    <div className="client-layout">
      <aside className="client-sidebar">
        <div className="sidebar-brand"><Scale /> CounselConnect</div>

        <nav aria-label="Client navigation">
          {menu.map(([label, path, Icon]) => (
            <NavLink
              end
              key={path}
              to={path}
              className={({ isActive }) => `client-menu-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={logout} className="client-menu-item logout" type="button">
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      <main className="client-main">
        <header className="client-header">
          <div>
            <p className="eyebrow">CLIENT WORKSPACE</p>
            <h1>Client dashboard</h1>
            <p>Manage your legal services in one place.</p>
          </div>
          <span>Welcome, {user?.full_name || "Client"}</span>
        </header>

        <div className="page-toolbar">
          <span className="muted">Your legal activity at a glance.</span>
          <button
            className="secondary-button"
            onClick={loadDashboard}
            disabled={loading}
            type="button"
          >
            <RefreshCw size={15} /> {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && <p className="page-alert error" role="alert">{error}</p>}

        {loading ? (
          <section className="panel" aria-live="polite">Loading your dashboard…</section>
        ) : (
          <>
            <section className="client-stats" aria-label="Account summary">
              <article className="client-card">
                <FileText />
                <h3>{requests.length}</h3>
                <p>Total legal requests</p>
              </article>
              <article className="client-card">
                <CalendarDays />
                <h3>{upcomingConsultations}</h3>
                <p>Upcoming consultations</p>
              </article>
              <article className="client-card">
                <MessageSquare />
                <h3>{unreadMessages}</h3>
                <p>Unread messages</p>
              </article>
              <article className="client-card">
                <Bell />
                <h3>{unreadNotifications}</h3>
                <p>Unread notifications</p>
              </article>
            </section>

            <section className="client-stats" aria-label="Workspace shortcuts">
              <article className="client-card">
                <FolderOpen />
                <h3><Link to="/client/documents">Documents</Link></h3>
                <p>Secure matter files</p>
              </article>
              <article className="client-card">
                <CalendarDays />
                <h3><Link to="/client/deadlines">Deadlines</Link></h3>
                <p>Important dates and tasks</p>
              </article>
              <article className="client-card">
                <Bell />
                <h3><Link to="/client/notifications">Notifications</Link></h3>
                <p>Recent platform updates</p>
              </article>
            </section>

            <section className="client-content">
              <div>
                <h2>My legal requests</h2>
                <p>
                  {requests.length
                    ? `${requests.length} request(s) submitted. Latest: ${requests[0]?.title || "Untitled request"}`
                    : "You have not submitted any legal requests yet."}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => navigate("/client/new-request")}
                type="button"
              >
                <PlusCircle size={18} /> New legal request
              </button>
            </section>

            <section className="panel recent-panel">
              <div className="section-heading">
                <h2>Recent activity</h2>
                <Link className="text-button" to="/client/requests">View all requests</Link>
              </div>

              {requests.slice(0, 4).map((item) => (
                <div className="mini-row" key={item.id}>
                  <div>
                    <strong>{item.title || "Untitled request"}</strong>
                    <p>{item.category || "General"} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Date unavailable"}</p>
                  </div>
                  <span className={`status status-${item.status || "pending"}`}>
                    {(item.status || "pending").replaceAll("_", " ")}
                  </span>
                </div>
              ))}

              {!requests.length && (
                <div className="empty-state">
                  <FileText />
                  <h3>No requests submitted yet</h3>
                  <p>Create a legal request to get started.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
