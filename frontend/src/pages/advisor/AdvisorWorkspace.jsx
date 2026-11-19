import { useCallback, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Scale, LayoutDashboard, FileText, CalendarDays, MessageSquare, UserRound, LogOut, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const sectionTitles = {
  requests: "Assigned legal matters",
  consultations: "Consultations",
  messages: "Messages",
  profile: "My profile",
};

export default function AdvisorWorkspace({ section }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState({ recipient_id: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (section === "profile") {
        const { data } = await API.get("/workspace/profile");
        setProfile(data.profile);
      } else {
        const { data } = await API.get(`/workspace/${section}`);
        setItems(data[section] || []);
        if (section === "messages") {
          const contactResponse = await API.get("/workspace/contacts");
          setContacts(contactResponse.data.contacts || []);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this workspace.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setError("");
    setNotice("");
    try {
      await API.patch(`/workspace/requests/${id}`, { status });
      setNotice("Matter status updated.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update this matter.");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      await API.post("/workspace/messages", { recipient_id: Number(message.recipient_id), body: message.body });
      setMessage({ recipient_id: "", body: "" });
      setNotice("Message sent successfully.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send message.");
    } finally { setSaving(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await API.patch("/workspace/profile", profile);
      setNotice("Profile saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const menu = [
    ["Dashboard", "/advisor/dashboard", LayoutDashboard],
    ["Assigned matters", "/advisor/requests", FileText],
    ["Consultations", "/advisor/consultations", CalendarDays],
    ["Messages", "/advisor/messages", MessageSquare],
    ["Profile", "/advisor/profile", UserRound],    
    ["Documents", "/advisor/documents", FileText],   
    ["Deadlines", "/advisor/deadlines", CalendarDays],    
    ["Notifications", "/advisor/notifications", MessageSquare],
  ];

  return (
    <div className="advisor-layout">
      <aside className="advisor-sidebar">
        <div className="advisor-brand"><Scale /> CounselConnect</div>
        <nav>{menu.map(([label, path, Icon]) => (
          <NavLink key={path} to={path} end className={({ isActive }) => isActive ? "active" : ""}>
            <Icon size={18} />{label}
          </NavLink>
        ))}</nav>
        <button onClick={logout}><LogOut size={18} /> Sign out</button>
      </aside>
      <main className="advisor-main">
        <div className="advisor-heading">
          <div><p className="eyebrow">ADVISOR WORKSPACE</p><h1>{sectionTitles[section]}</h1><p>Manage your assigned work and client communication.</p></div>
          <button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={15}/> Refresh</button>
        </div>
        {error && <p className="page-alert error">{error}</p>}
        {notice && <p className="page-alert success">{notice}</p>}
        {loading ? <section className="panel">Loading {sectionTitles[section].toLowerCase()}…</section> :
          section === "requests" ? (
            <section className="panel">
              {items.length === 0 ? <div className="empty-state"><FileText/><h3>No assigned matters</h3><p>Matters assigned to you will appear here.</p></div> :
                <div className="data-list">{items.map(item => (
                  <article className="data-row" key={item.id}>
                    <div><h3>{item.title}</h3><p>{item.client_name} · {item.category} · {new Date(item.created_at).toLocaleDateString()}</p><p className="muted">{item.description}</p><p className="muted">Priority: {item.priority}</p></div>
                    <label className="advisor-status-control">Status
                      <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)}>
                        <option value="pending">Pending</option><option value="in_review">In review</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="rejected">Rejected</option>
                      </select>
                    </label>
                  </article>
                ))}</div>}
            </section>
          ) : section === "consultations" ? (
            <section className="panel">{items.length ? items.map(item => (
              <article className="data-row" key={item.id}><div><h3>{item.request_title || "Client consultation"}</h3><p>{item.client_name || "Client"} · {new Date(item.scheduled_at).toLocaleString()}</p><p className="muted">{item.meeting_type} · {item.notes || "No notes"}</p></div><span className="status">{item.status}</span></article>
            )) : <div className="empty-state"><CalendarDays/><h3>No consultations</h3><p>Client consultation requests will appear here.</p></div>}</section>
          ) : section === "messages" ? (
            <section className="panel">
              <form className="workspace-form" onSubmit={sendMessage}>
                <h2>Send a client message</h2>
                <label>Client *<select required value={message.recipient_id} onChange={e => setMessage({ ...message, recipient_id: e.target.value })}><option value="">Select a client</option>{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}</select></label>
                <label>Message *<textarea required rows="3" maxLength="5000" value={message.body} onChange={e => setMessage({ ...message, body: e.target.value })} placeholder="Write your message…"/></label>
                <button className="primary-button" disabled={saving || !contacts.length}>{saving ? "Sending…" : "Send message"}</button>
                {!contacts.length && <p className="muted">Clients assigned to your matters will appear here.</p>}
              </form>
              {items.length ? items.map(item => (
                <article className="data-row" key={item.id}><div><h3>{item.sender_name} → {item.recipient_name}</h3><p>{item.body}</p><p className="muted">{new Date(item.created_at).toLocaleString()}</p></div></article>
              )) : <div className="empty-state"><MessageSquare/><h3>No messages yet</h3><p>Messages related to your client work will appear here.</p></div>}
            </section>
          ) : (
            <section className="panel"><form className="workspace-form profile-form" onSubmit={saveProfile}>
              {profile && ["full_name", "email", "phone"].map(key => <label key={key}>{key.replace("_", " ")}<input value={profile[key] || ""} disabled={key === "email"} onChange={e => setProfile({ ...profile, [key]: e.target.value })}/></label>)}
              <button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
            </form></section>
          )}
      </main>
    </div>
  );
}
