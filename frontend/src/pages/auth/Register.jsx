import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, ArrowRight } from "lucide-react";
import API from "../../services/api";

const initial = { full_name:"", email:"", phone:"", password:"", company_name:"", business_type:"", company_size:"", industry:"" };
export default function Register() {
  const navigate = useNavigate();
  const [formData,setFormData] = useState(initial);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [loading,setLoading] = useState(false);
  const change = e => setFormData({...formData,[e.target.name]:e.target.value});
  const submit = async e => {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const {data} = await API.post("/auth/register",formData);
      setMessage(data.message || "Account created. You can now sign in.");
      setTimeout(()=>navigate("/login"),1200);
    } catch(err) { setError(err.response?.data?.message || "Registration failed. Please try again."); }
    finally { setLoading(false); }
  };
  return (
    <div className="auth-page">
      <section className="auth-aside">
        <div className="brand brand-white"><span className="brand-mark"><Scale size={20}/></span> Counsel<span className="brand-light">Connect</span></div>
        <div className="aside-copy"><p className="eyebrow">GET STARTED</p><h1>Legal guidance that grows with your business.</h1><p>Create your client account to get started with ongoing legal support.</p></div>
        <p className="aside-foot">Your business. Your legal team. One workspace.</p>
      </section>
      <main className="auth-main register-main"><div className="auth-card register-card">
        <p className="eyebrow">CLIENT REGISTRATION</p><h2>Create your account</h2><p className="form-intro">Tell us a little about yourself and your business.</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field"><label>Full name *</label><input name="full_name" placeholder="Your full name" value={formData.full_name} onChange={change} required/></div>
            <div className="field"><label>Email address *</label><input type="email" name="email" placeholder="you@company.com" value={formData.email} onChange={change} required/></div>
            <div className="field"><label>Phone number</label><input type="tel" name="phone" placeholder="Phone number" value={formData.phone} onChange={change}/></div>
            <div className="field"><label>Password *</label><input type="password" name="password" minLength="8" placeholder="At least 8 characters" value={formData.password} onChange={change} required/></div>
            <div className="field"><label>Company name</label><input name="company_name" placeholder="Company name" value={formData.company_name} onChange={change}/></div>
            <div className="field"><label>Business type</label><select name="business_type" value={formData.business_type} onChange={change}><option value="">Select business type</option><option>Startup</option><option>Small business</option><option>Private limited company</option><option>Partnership</option><option>Other</option></select></div>
            <div className="field"><label>Company size</label><select name="company_size" value={formData.company_size} onChange={change}><option value="">Select company size</option><option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option></select></div>
            <div className="field"><label>Industry</label><input name="industry" placeholder="e.g. Technology" value={formData.industry} onChange={change}/></div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"} <ArrowRight size={17}/></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div></main>
    </div>
  );
}
