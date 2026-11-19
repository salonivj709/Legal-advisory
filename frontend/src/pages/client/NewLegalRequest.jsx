import {useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {ArrowLeft,Send} from "lucide-react";
import API from "../../services/api";

export default function NewLegalRequest(){
 const navigate=useNavigate();
 const [form,setForm]=useState({title:"",category:"",description:"",priority:"medium"});
 const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 const submit=async e=>{e.preventDefault();setError("");setLoading(true);
  try{await API.post("/workspace/requests",form);navigate("/client/requests",{replace:true,state:{notice:"Your legal request was submitted successfully."}});}
  catch(err){setError(err.response?.data?.message||"Could not submit your request. Please try again.");}
  finally{setLoading(false);}
 };
 return <div className="workspace-page"><Link className="back-link" to="/client/dashboard"><ArrowLeft size={16}/> Back to dashboard</Link>
 <section className="panel form-panel"><p className="eyebrow">CLIENT WORKSPACE</p><h1>Submit a legal request</h1><p className="muted">Tell our legal team what support your business needs.</p>
 <form className="workspace-form" onSubmit={submit}>
 <label>Request title *<input name="title" value={form.title} onChange={change} placeholder="e.g. Review a vendor agreement" maxLength="200" required/></label>
 <label>Legal service category *<select name="category" value={form.category} onChange={change} required><option value="">Select a category</option><option>Contract review and drafting</option><option>Corporate and commercial</option><option>Employment and HR</option><option>Intellectual property</option><option>Privacy and data protection</option><option>Regulatory compliance</option><option>Dispute resolution</option><option>Other</option></select></label>
 <label>Priority<select name="priority" value={form.priority} onChange={change}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
 <label>Describe your legal requirement *<textarea name="description" value={form.description} onChange={change} rows="6" placeholder="Include relevant background, deadlines and the outcome you need..." required/></label>
 {error&&<p className="form-error">{error}</p>}
 <button className="primary-button" disabled={loading}>{loading?"Submitting...":"Submit legal request"} <Send size={16}/></button>
 </form></section></div>;
}
