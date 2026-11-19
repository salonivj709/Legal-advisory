const db = require('../config/db');
const run = (sql, params=[]) => db.promise().execute(sql, params);
const error = (res, e, message) => { console.error(message, e.message); return res.status(500).json({success:false,message}); };

exports.getOverview = async (req,res) => {
 try {
  const [[users]] = await run("SELECT COUNT(*) total, SUM(role='client') clients, SUM(role='advisor') advisors, SUM(role='admin') admins, SUM(status='active') active, SUM(status='suspended') suspended FROM users");
  const [[requests]] = await run("SELECT COUNT(*) total, SUM(status='pending') pending, SUM(status='completed') completed FROM legal_requests");
  res.json({success:true, overview:{...users, requests:requests.total||0, pending_requests:requests.pending||0, completed_requests:requests.completed||0}});
 } catch(e){ error(res,e,'Unable to load admin overview'); }
};
exports.listUsers = async (req,res) => {
 try {
  const search = String(req.query.search||'').trim();
  const role = String(req.query.role||'').trim();
  const status = String(req.query.status||'').trim();
  const page = Math.max(1,parseInt(req.query.page,10)||1), limit = Math.min(100,Math.max(1,parseInt(req.query.limit,10)||50));
  const where=[], params=[];
  if(search){ where.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if(['client','advisor','admin'].includes(role)){where.push('role=?');params.push(role);}
  if(['active','inactive','suspended'].includes(status)){where.push('status=?');params.push(status);}
  const clause=where.length?`WHERE ${where.join(' AND ')}`:'';
  const [[count]]=await run(`SELECT COUNT(*) total FROM users ${clause}`,params);
  const [users]=await run(`SELECT id,full_name,email,phone,role,status,created_at FROM users ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]);
  res.json({success:true,users,pagination:{page,limit,total:count.total,totalPages:Math.ceil(count.total/limit)}});
 } catch(e){error(res,e,'Unable to load users');}
};
exports.updateUser = async (req,res) => {
 const id=Number(req.params.id), {role,status}=req.body||{};
 if(!Number.isInteger(id)||id<1) return res.status(400).json({success:false,message:'Invalid user id'});
 if(role!==undefined&&!['client','advisor','admin'].includes(role)) return res.status(400).json({success:false,message:'Invalid role'});
 if(status!==undefined&&!['active','inactive','suspended'].includes(status)) return res.status(400).json({success:false,message:'Invalid status'});
 if(role===undefined&&status===undefined) return res.status(400).json({success:false,message:'Nothing to update'});
 if(id===Number(req.user.id) && (status==='suspended'||status==='inactive'||role&&role!=='admin')) return res.status(400).json({success:false,message:'You cannot disable or demote your own admin account'});
 try {
  const sets=[], values=[]; if(role!==undefined){sets.push('role=?');values.push(role);} if(status!==undefined){sets.push('status=?');values.push(status);}
  await run(`UPDATE users SET ${sets.join(', ')} WHERE id=?`,[...values,id]);
  const [rows]=await run('SELECT id,full_name,email,phone,role,status,created_at FROM users WHERE id=?',[id]);
  if(!rows.length) return res.status(404).json({success:false,message:'User not found'});
  res.json({success:true,message:'User updated successfully',user:rows[0]});
 } catch(e){error(res,e,'Unable to update user');}
};
exports.getSettings = async (req,res) => {
 try {
  const [rows]=await run('SELECT setting_key,setting_value,updated_at FROM platform_settings ORDER BY setting_key');
  const defaults={platform_name:'CounselConnect',support_email:'support@example.com',default_timezone:'Asia/Kolkata',maintenance_mode:'false',allow_client_registration:'true',allow_advisor_registration:'true'};
  rows.forEach(r=>defaults[r.setting_key]=r.setting_value);
  res.json({success:true,settings:defaults});
 } catch(e){error(res,e,'Unable to load platform settings');}
};
exports.updateSettings = async (req,res) => {
 const allowed=['platform_name','support_email','default_timezone','maintenance_mode','allow_client_registration','allow_advisor_registration'];
 const input=req.body?.settings;
 if(!input||typeof input!=='object'||Array.isArray(input)) return res.status(400).json({success:false,message:'Settings object is required'});
 try {
  for(const key of allowed){ if(input[key]!==undefined){
   let value=String(input[key]).trim();
   if(['maintenance_mode','allow_client_registration','allow_advisor_registration'].includes(key) && !['true','false'].includes(value)) return res.status(400).json({success:false,message:`Invalid value for ${key}`});
   if(key==='support_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return res.status(400).json({success:false,message:'Enter a valid support email'});
   await run('INSERT INTO platform_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',[key,value]);
  }}
  return exports.getSettings(req,res);
 } catch(e){error(res,e,'Unable to save platform settings');}
};
exports.getAccess = async (req,res) => res.json({success:true,roles:[
 {role:'admin',description:'Full platform administration.',permissions:['View dashboard and platform metrics','View and manage all users','Change user roles and account status','View role and permission definitions','Update platform settings','View all legal requests and consultations']},
 {role:'advisor',description:'Manage assigned legal work and client communication.',permissions:['View advisor dashboard','View legal requests','Update request status and assignment','View consultations','Send and receive messages','Manage own profile']},
 {role:'client',description:'Request and manage the client’s own legal services.',permissions:['View client dashboard','Create and view own legal requests','Request consultations','Send and receive messages','Manage own profile']}
]});

exports.listAdvisors = async (req, res) => {
  try {
    const [advisors] = await run(
      "SELECT id, full_name, email FROM users WHERE role='advisor' AND status='active' ORDER BY full_name"
    );
    res.json({ success: true, advisors });
  } catch (error) {
    error(res, error, "Unable to load advisors");
  }
};
