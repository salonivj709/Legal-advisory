import {useEffect,useState} from 'react';
import {Users,UserRound,BriefcaseBusiness,FileText,RefreshCw} from 'lucide-react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
export default function AdminDashboard(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);setError('');try{const r=await API.get('/admin/overview');setData(r.data.overview);}catch(e){setError(e.response?.data?.message||'Could not load dashboard data. Check that the backend is running.');}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const cards=[['Total users',data?.total??'—',Users],['Clients',data?.clients??'—',UserRound],['Advisors',data?.advisors??'—',BriefcaseBusiness],['Legal requests',data?.requests??'—',FileText]];
 return <AdminLayout><div className="admin-page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Admin dashboard</h1><p className="lead">Platform overview and administration workspace.</p></div><button className="admin-button secondary" onClick={load}><RefreshCw size={16}/> Refresh</button></div>{error&&<div className="admin-alert error">{error}</div>}<div className="admin-stat-grid">{cards.map(([label,value,Icon])=><section className="admin-stat-card" key={label}><span><Icon size={20}/></span><p>{label}</p><strong>{loading?'…':value}</strong></section>)}</div><section className="admin-panel"><h2>Request overview</h2><div className="admin-summary-grid"><div><span>Pending requests</span><strong>{loading?'…':data?.pending_requests??0}</strong></div><div><span>Completed requests</span><strong>{loading?'…':data?.completed_requests??0}</strong></div><div><span>Active users</span><strong>{loading?'…':data?.active??0}</strong></div><div><span>Suspended users</span><strong>{loading?'…':data?.suspended??0}</strong></div></div></section></AdminLayout>;
}
