import { useNavigate } from "react-router-dom";
import { Scale, LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Scale size={20}/></span> Counsel<span className="brand-light">Connect</span></div>
      <div className="topbar-right">
        <span className="user-label">{user?.full_name || "Account"}</span>
        <button className="logout-button" onClick={logout}><LogOut size={16}/> Sign out</button>
      </div>
    </header>
  );
}
