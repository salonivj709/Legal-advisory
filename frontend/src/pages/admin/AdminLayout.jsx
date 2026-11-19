import Navbar from '../../components/Navbar';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, Settings, FileText } from 'lucide-react';
const links=[['Overview','/admin/dashboard',LayoutDashboard],['User management','/admin/users',Users],['Legal requests','/admin/requests',FileText],['Access control','/admin/access-control',ShieldCheck],['Platform settings','/admin/settings',Settings]];
export default function AdminLayout({children}){
 const location=useLocation();
 return <div className="app-shell"><Navbar/><div className="admin-layout"><aside className="admin-sidebar"><p className="admin-nav-label">ADMIN WORKSPACE</p>{links.map(([label,path,Icon])=><Link key={path} to={path} className={`admin-nav-link ${location.pathname===path?'active':''}`}><Icon size={18}/>{label}</Link>)}</aside><main className="admin-content">{children}</main></div></div>;
}
