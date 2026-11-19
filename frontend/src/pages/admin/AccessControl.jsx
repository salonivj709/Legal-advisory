import {useEffect,useState} from 'react';
import {ShieldCheck,RefreshCw} from 'lucide-react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
export default function AccessControl(){
 const [roles,setRoles]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=async()=>{setLoading(true);setError('');try{const r=await API.get('/admin/access-control');setRoles(r.data.roles||[]);}catch(e){setError(e.response?.data?.message||'Unable to load role permissions.');}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 return <AdminLayout><div className="admin-page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Access Control</h1><p className="lead">Review the permissions assigned to each platform role.</p></div><button className="admin-button secondary" onClick={load}><RefreshCw size={16}/> Refresh</button></div>{error&&<div className="admin-alert error">{error}</div>}{loading?<div className="admin-panel">Loading role permissions…</div>:<div className="role-card-grid">{roles.map(item=><section className="admin-panel role-card" key={item.role}><div className="role-card-title"><span><ShieldCheck size={20}/></span><div><h2>{item.role[0].toUpperCase()+item.role.slice(1)}</h2><p>{item.description}</p></div></div><h3>Permissions</h3><ul>{item.permissions.map(permission=><li key={permission}>{permission}</li>)}</ul></section>)}</div>}<p className="admin-help-text">Role permissions are enforced by backend route authorization. This page documents the current access model; it does not grant arbitrary custom permissions.</p></AdminLayout>;
}
