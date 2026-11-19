import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, ArrowRight } from "lucide-react";
import API from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await API.post("/auth/login", formData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const routes = { client: "/client/dashboard", advisor: "/advisor/dashboard", admin: "/admin/dashboard" };
      navigate(routes[data.user.role] || "/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Check the API server and try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <section className="auth-aside">
        <div className="brand brand-white"><span className="brand-mark"><Scale size={20}/></span> Counsel<span className="brand-light">Connect</span></div>
        <div className="aside-copy"><p className="eyebrow">LEGAL SUPPORT, SIMPLIFIED</p><h1>Clarity for every business decision.</h1><p>Connect with experienced legal professionals and keep your business moving with confidence.</p></div>
        <p className="aside-foot">A smarter way to manage ongoing legal support.</p>
      </section>
      <main className="auth-main">
        <div className="auth-card">
          <p className="eyebrow">WELCOME BACK</p><h2>Sign in to your account</h2><p className="form-intro">Enter your details to access your workspace.</p>
          <form onSubmit={handleSubmit}>
            <label>Email address</label><input type="email" autoComplete="email" placeholder="you@company.com" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} required/>
            <label>Password</label><input type="password" autoComplete="current-password" placeholder="Enter your password" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} required/>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"} <ArrowRight size={17}/></button>
          </form>
          <p className="auth-switch">New to CounselConnect? <Link to="/register">Create an account</Link></p>
        </div>
      </main>
    </div>
  );
}
