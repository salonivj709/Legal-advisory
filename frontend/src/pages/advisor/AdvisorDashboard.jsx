import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, CalendarDays, MessageSquareText, ArrowRight } from "lucide-react";
import API from "../../services/api";
import AdvisorWorkspace from "./AdvisorWorkspace";

export default function AdvisorDashboard() {
  const [summary, setSummary] = useState({ requests: 0, consultations: 0, messages: 0 });
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      API.get("/workspace/requests"),
      API.get("/workspace/consultations"),
      API.get("/workspace/messages"),
    ]).then(([requests, consultations, messages]) => {
      if (active) setSummary({
        requests: requests.data.requests?.length || 0,
        consultations: consultations.data.consultations?.length || 0,
        messages: messages.data.messages?.length || 0,
      });
    }).catch(err => { if (active) setError(err.response?.data?.message || "Unable to load dashboard data."); });
    return () => { active = false; };
  }, []);
  return (
    <div className="advisor-layout">
      <aside className="advisor-sidebar"><div className="advisor-brand">⚖ CounselConnect</div><nav>
        <Link className="active" to="/advisor/dashboard">Dashboard</Link><Link to="/advisor/requests">Assigned matters</Link><Link to="/advisor/consultations">Consultations</Link><Link to="/advisor/messages">Messages</Link><Link to="/advisor/profile">Profile</Link>
      </nav></aside>
      <main className="advisor-main">
        <div className="advisor-heading"><div><p className="eyebrow">ADVISOR WORKSPACE</p><h1>Advisor dashboard</h1><p>Review your matters, consultations and client communication.</p></div></div>
        {error && <p className="page-alert error">{error}</p>}
        <div className="advisor-grid">
          <article className="advisor-stat"><span><BriefcaseBusiness size={19}/> Assigned matters</span><strong>{summary.requests}</strong><Link to="/advisor/requests">View matters <ArrowRight size={14}/></Link></article>
          <article className="advisor-stat"><span><CalendarDays size={19}/> Consultations</span><strong>{summary.consultations}</strong><Link to="/advisor/consultations">View schedule <ArrowRight size={14}/></Link></article>
          <article className="advisor-stat"><span><MessageSquareText size={19}/> Messages</span><strong>{summary.messages}</strong><Link to="/advisor/messages">Open messages <ArrowRight size={14}/></Link></article>
        </div>
        <section className="panel">
          <h2>Matter tools</h2>
          <div className="quick-links">
            <Link to="/advisor/documents">Manage matter documents</Link>
            <Link to="/advisor/deadlines">View deadlines & tasks</Link>
            <Link to="/advisor/notifications">View notifications</Link>
          </div>
        </section>
        <section className="panel"><h2>Getting started</h2><p className="muted">Open Assigned matters to review client requests and update their progress. Use Consultations to review upcoming client meetings.</p></section>
      </main>
    </div>
  );
}
