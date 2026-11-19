import { useCallback, useEffect, useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import API from "../../services/api";
import AdminLayout from "./AdminLayout";

export default function AdminLegalRequests() {
  const [requests, setRequests] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [requestResponse, advisorResponse] = await Promise.all([
        API.get("/workspace/requests"),
        API.get("/admin/advisors"),
      ]);
      setRequests(requestResponse.data.requests || []);
      setAdvisors(advisorResponse.data.advisors || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load legal requests.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (id, changes) => {
    setError(""); setNotice("");
    try {
      await API.patch(`/workspace/requests/${id}`, changes);
      setNotice("Legal request updated.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update legal request.");
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-heading">
        <div><p className="eyebrow">ADMINISTRATION</p><h1>Legal requests</h1><p className="lead">Review incoming work, assign an advisor and monitor progress.</p></div>
        <button className="admin-button secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button>
      </div>
      {error && <p className="admin-alert error">{error}</p>}
      {notice && <p className="admin-alert success">{notice}</p>}
      <section className="admin-panel">
        {loading ? <p className="table-message">Loading legal requests…</p> : requests.length === 0 ? <div className="empty-state"><FileText/><h3>No legal requests yet</h3><p>New client requests will appear here.</p></div> : (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Request</th><th>Client</th><th>Priority</th><th>Advisor</th><th>Status</th></tr></thead>
            <tbody>{requests.map(request => (
              <tr key={request.id}>
                <td><strong>{request.title}</strong><small>{request.category}</small><small>{request.description}</small></td>
                <td>{request.client_name}</td><td>{request.priority}</td>
                <td><select aria-label={`Assign advisor to ${request.title}`} value={request.advisor_id || ""} onChange={e => update(request.id, { status: request.status, advisor_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">Unassigned</option>{advisors.map(advisor => <option key={advisor.id} value={advisor.id}>{advisor.full_name}</option>)}
                </select></td>
                <td><select aria-label={`Status for ${request.title}`} value={request.status} onChange={e => update(request.id, { status: e.target.value, advisor_id: request.advisor_id })}>
                  <option value="pending">Pending</option><option value="in_review">In review</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="rejected">Rejected</option>
                </select></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </AdminLayout>
  );
}
