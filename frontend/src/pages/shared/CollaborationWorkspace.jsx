
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, CalendarClock, Download, FileText, RefreshCw, Upload } from "lucide-react";
import API from "../../services/api";

const sectionLabels = {
  documents: "Matter documents",
  deadlines: "Deadlines & tasks",
  notifications: "Notifications",
};

export default function CollaborationWorkspace({ role, section }) {
  const [matters, setMatters] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [matterId, setMatterId] = useState("");
  const [file, setFile] = useState(null);
  const [deadline, setDeadline] = useState({ legal_request_id: "", title: "", description: "", due_at: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const root = `/${role}`;
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (section === "documents") {
        const { data } = await API.get("/workspace/requests");
        const list = data.requests || [];
        setMatters(list);
        const selected = matterId || (list[0] ? String(list[0].id) : "");
        setMatterId(selected);
        if (selected) {
          const response = await API.get(`/collaboration/documents?matterId=${selected}`);
          setDocuments(response.data.documents || []);
        } else setDocuments([]);
      } else if (section === "deadlines") {
        const [matterResponse, deadlineResponse] = await Promise.all([
          API.get("/workspace/requests"), API.get("/collaboration/deadlines")
        ]);
        setMatters(matterResponse.data.requests || []);
        setDeadlines(deadlineResponse.data.deadlines || []);
      } else {
        const { data } = await API.get("/collaboration/notifications");
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${sectionLabels[section].toLowerCase()}.`);
    } finally { setLoading(false); }
  }, [section, matterId]);

  useEffect(() => { load(); }, [load]);

  const upload = async (event) => {
    event.preventDefault();
    if (!file || !matterId) return;
    const formElement = event.currentTarget;
    setSaving(true); setError(""); setNotice("");
    try {
      const body = new FormData();
      body.append("document", file);
      body.append("legal_request_id", matterId);
      await API.post("/collaboration/documents", body, { headers: { "Content-Type": "multipart/form-data" } });
      setFile(null);
      formElement.reset();
      setNotice("Document uploaded successfully.");
      await load();
    } catch (err) { setError(err.response?.data?.message || "Document upload failed."); }
    finally { setSaving(false); }
  };

  const createDeadline = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await API.post("/collaboration/deadlines", {
        ...deadline, due_at: new Date(deadline.due_at).toISOString()
      });
      setDeadline({ legal_request_id: "", title: "", description: "", due_at: "" });
      setNotice("Deadline created successfully.");
      await load();
    } catch (err) { setError(err.response?.data?.message || "Could not create deadline."); }
    finally { setSaving(false); }
  };

  const updateDeadline = async (id, status) => {
    try {
      await API.patch(`/collaboration/deadlines/${id}`, { status });
      setNotice("Deadline status updated.");
      await load();
    } catch (err) { setError(err.response?.data?.message || "Could not update deadline."); }
  };

  const markRead = async (id) => {
    try {
      await API.patch(`/collaboration/notifications/${id}/read`);
      setNotifications(current => current.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (err) { setError(err.response?.data?.message || "Could not update notification."); }
  };

  const download = async (item) => {
    try {
      const response = await API.get(`/collaboration/documents/${item.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = item.original_name; anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || "Download failed."); }
  };

  return (
    <div className="workspace-page">
      <Link className="back-link" to={`${root}/dashboard`}><ArrowLeft size={16}/> Back to dashboard</Link>
      <section className="panel collaboration-panel">
        <div className="section-heading">
          <div><p className="eyebrow">{role.toUpperCase()} WORKSPACE</p><h1>{sectionLabels[section]}</h1>
            <p className="muted">Keep matter files, important dates and platform updates organised.</p>
          </div>
          <button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={15}/> Refresh</button>
        </div>
        {error && <p className="page-alert error">{error}</p>}
        {notice && <p className="page-alert success">{notice}</p>}
        {loading ? <p className="muted">Loading…</p> : section === "documents" ? (
          <>
            <form className="workspace-form collaboration-form" onSubmit={upload}>
              <h2>Upload a matter document</h2>
              <label>Legal matter *
                <select required value={matterId} onChange={e => setMatterId(e.target.value)}>
                  <option value="">Select a matter</option>
                  {matters.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label>Choose file *<input type="file" required accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.txt" onChange={e => setFile(e.target.files?.[0] || null)}/></label>
              <p className="muted">Maximum 10 MB. Supported: PDF, DOC, DOCX, XLSX, PNG, JPG and TXT.</p>
              <button className="primary-button" disabled={saving || !file || !matterId}><Upload size={16}/>{saving ? "Uploading…" : "Upload securely"}</button>
            </form>
            <h2 className="subsection-title">Documents for selected matter</h2>
            <div className="data-list">{documents.length ? documents.map(item => (
              <article className="data-row" key={item.id}>
                <div><h3><FileText size={17}/> {item.original_name}</h3>
                  <p>{item.uploaded_by_name} · {new Date(item.created_at).toLocaleString()}</p>
                  <p className="muted">{(Number(item.file_size) / 1024).toFixed(1)} KB · {item.mime_type}</p>
                </div>
                <button className="secondary-button" onClick={() => download(item)}><Download size={15}/> Download</button>
              </article>
            )) : <div className="empty-state"><FileText/><h3>No documents uploaded</h3><p>Upload the first document for this matter.</p></div>}</div>
          </>
        ) : section === "deadlines" ? (
          <>
            <form className="workspace-form collaboration-form" onSubmit={createDeadline}>
              <h2>Add a deadline or task</h2>
              <label>Related matter *<select required value={deadline.legal_request_id} onChange={e => setDeadline({ ...deadline, legal_request_id: e.target.value })}>
                <option value="">Select a matter</option>{matters.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select></label>
              <label>Task / deadline title *<input required maxLength="200" value={deadline.title} onChange={e => setDeadline({ ...deadline, title: e.target.value })} placeholder="e.g. Submit signed agreement"/></label>
              <label>Due date and time *<input required type="datetime-local" min={new Date().toISOString().slice(0,16)} value={deadline.due_at} onChange={e => setDeadline({ ...deadline, due_at: e.target.value })}/></label>
              <label>Description<textarea rows="3" value={deadline.description} onChange={e => setDeadline({ ...deadline, description: e.target.value })}/></label>
              <button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Create deadline"}</button>
            </form>
            <h2 className="subsection-title">Matter deadlines</h2>
            <div className="data-list">{deadlines.length ? deadlines.map(item => (
              <article className="data-row" key={item.id}>
                <div><h3><CalendarClock size={17}/> {item.title}</h3><p>{item.matter_title} · Due {new Date(item.due_at).toLocaleString()}</p><p className="muted">{item.description || "No additional details"}</p></div>
                <div className="deadline-actions"><span className={`status status-${item.status}`}>{item.status}</span>
                  {item.status === "open" && <button className="secondary-button" onClick={() => updateDeadline(item.id, "completed")}>Mark complete</button>}
                </div>
              </article>
            )) : <div className="empty-state"><CalendarClock/><h3>No deadlines yet</h3><p>Important matter dates and tasks will appear here.</p></div>}</div>
          </>
        ) : (
          <div className="data-list">{notifications.length ? notifications.map(item => (
            <article className={`data-row notification-row ${item.read_at ? "" : "unread"}`} key={item.id}>
              <div><h3><Bell size={17}/> {item.title}</h3><p>{item.body}</p><p className="muted">{new Date(item.created_at).toLocaleString()}</p></div>
              {!item.read_at && <button className="secondary-button" onClick={() => markRead(item.id)}>Mark as read</button>}
            </article>
          )) : <div className="empty-state"><Bell/><h3>You're all caught up</h3><p>New updates about your legal matters will appear here.</p></div>}</div>
        )}
      </section>
    </div>
  );
}
