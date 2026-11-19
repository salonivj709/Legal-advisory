import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, CalendarDays, MessageSquare, RefreshCw, Send } from "lucide-react";
import API from "../../services/api";

const titles = {
  requests: "My Legal Requests",
  consultations: "Consultations",
  messages: "Messages",
  profile: "My Profile",
};

export default function ClientWorkspace({ section }) {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [legalRequests, setLegalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [consultation, setConsultation] = useState({ scheduled_at: "", meeting_type: "video", notes: "", legal_request_id: "" });
  const [message, setMessage] = useState({ recipient_id: "", legal_request_id: "", body: "" });

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
        if (section === "consultations") {
          const requestResponse = await API.get("/workspace/requests");
          setLegalRequests(requestResponse.data.requests || []);
        }
        if (section === "messages") {
          const contactResponse = await API.get("/workspace/contacts");
          setContacts(contactResponse.data.contacts || []);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this section.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      await API.patch("/workspace/profile", profile);
      setNotice("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed.");
    } finally { setSaving(false); }
  };

  const requestConsultation = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await API.post("/workspace/consultations", {
        ...consultation,
        scheduled_at: new Date(consultation.scheduled_at).toISOString(),
        legal_request_id: consultation.legal_request_id || null,
      });
      setNotice("Consultation request submitted.");
      setConsultation({ scheduled_at: "", meeting_type: "video", notes: "", legal_request_id: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to request a consultation.");
    } finally { setSaving(false); }
  };

  const sendMessage = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await API.post("/workspace/messages", {
        ...message,
        recipient_id: Number(message.recipient_id),
        legal_request_id: message.legal_request_id || null,
      });
      setNotice("Message sent.");
      setMessage({ recipient_id: "", legal_request_id: "", body: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send message.");
    } finally { setSaving(false); }
  };

  return (
    <div className="workspace-page">
      <Link className="back-link" to="/client/dashboard"><ArrowLeft size={16}/> Back to dashboard</Link>
      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">CLIENT WORKSPACE</p><h1>{titles[section]}</h1></div>
          <button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={15}/> Refresh</button>
        </div>
        {location.state?.notice && <p className="page-alert success">{location.state.notice}</p>}
        {notice && <p className="page-alert success">{notice}</p>}
        {error && <p className="page-alert error">{error}</p>}
        {loading ? <p className="muted">Loading {titles[section].toLowerCase()}…</p> :
          section === "profile" ? (
            profile ? <form className="workspace-form profile-form" onSubmit={saveProfile}>
              {["full_name", "email", "phone", "company_name", "business_type", "company_size", "industry"].map(key => (
                <label key={key}>{key.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase())}
                  <input value={profile[key] || ""} disabled={key === "email"} onChange={e => setProfile({ ...profile, [key]: e.target.value })}/>
                </label>
              ))}
              <button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
            </form> : <p className="muted">Profile details are unavailable.</p>
          ) : section === "requests" ? (
            items.length ? <div className="data-list">{items.map(item => (
              <article className="data-row" key={item.id}>
                <div><h3>{item.title}</h3><p>{item.category} · {new Date(item.created_at).toLocaleDateString()}</p><p className="muted">{item.description}</p><p className="muted">Priority: {item.priority}</p></div>
                <span className={`status status-${item.status}`}>{item.status.replaceAll("_", " ")}</span>
              </article>
            ))}</div> : <div className="empty-state"><FileText/><h3>No legal requests yet</h3><p>Your submitted requests will appear here.</p><Link className="primary-link" to="/client/new-request">Create your first request</Link></div>
          ) : section === "consultations" ? (
            <>
              <form className="workspace-form" onSubmit={requestConsultation}>
                <h2>Request a consultation</h2>
                <label>Date and time *<input type="datetime-local" required value={consultation.scheduled_at} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} onChange={e => setConsultation({ ...consultation, scheduled_at: e.target.value })}/></label>
                <label>Related legal request *<select required value={consultation.legal_request_id} onChange={e => setConsultation({ ...consultation, legal_request_id: e.target.value })}><option value="">Select a legal request</option>{legalRequests.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
                <label>Meeting type<select value={consultation.meeting_type} onChange={e => setConsultation({ ...consultation, meeting_type: e.target.value })}><option value="video">Video call</option><option value="phone">Phone call</option><option value="in_person">In person</option></select></label>
                <label>Notes<textarea rows="3" value={consultation.notes} onChange={e => setConsultation({ ...consultation, notes: e.target.value })} placeholder="Share your preferred time or discussion points."/></label>
                <button className="primary-button" disabled={saving}>{saving ? "Submitting…" : "Request consultation"}</button>
              </form>
              <div className="data-list">{items.length ? items.map(item => (
                <article className="data-row" key={item.id}><div><h3>{item.request_title || "Consultation"}</h3><p>{new Date(item.scheduled_at).toLocaleString()} · {item.meeting_type}</p><p className="muted">{item.notes || "No additional notes"}</p></div><span className="status">{item.status}</span></article>
              )) : <div className="empty-state"><CalendarDays/><h3>No consultations scheduled</h3><p>Your consultation requests and confirmed meetings will appear here.</p></div>}</div>
            </>
          ) : (
            <>
              <form className="workspace-form" onSubmit={sendMessage}>
                <h2>Send a message</h2>
                <label>Legal team contact *<select required value={message.recipient_id} onChange={e => setMessage({ ...message, recipient_id: e.target.value })}><option value="">Select an advisor</option>{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.full_name} ({contact.role})</option>)}</select></label>
                <label>Message *<textarea required rows="3" maxLength="5000" value={message.body} onChange={e => setMessage({ ...message, body: e.target.value })} placeholder="Write your message…"/></label>
                <button className="primary-button" disabled={saving || !contacts.length}>{saving ? "Sending…" : "Send message"} <Send size={16}/></button>
                {!contacts.length && <p className="muted">A contact will appear here after an advisor is assigned to one of your legal requests.</p>}
              </form>
              <div className="data-list">{items.length ? items.map(item => (
                <article className="data-row" key={item.id}><div><h3>{item.sender_name} → {item.recipient_name}</h3><p>{item.body}</p><p className="muted">{new Date(item.created_at).toLocaleString()}</p></div></article>
              )) : <div className="empty-state"><MessageSquare/><h3>No messages yet</h3><p>Messages from your legal team will appear here.</p></div>}</div>
            </>
          )}
      </section>
    </div>
  );
}
