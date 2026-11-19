const db = require("../config/db");

const query = (sql, params=[]) => db.promise().execute(sql, params);
const fail = (res, error, message="Request failed") => {
  console.error(message, error.message);
  return res.status(500).json({ success:false, message });
};

exports.listRequests = async (req,res) => {
  try {
    const scope = req.user.role === "client"
      ? "WHERE r.client_id=?"
      : req.user.role === "advisor"
        ? "WHERE r.advisor_id=?"
        : "";
    const params = scope ? [req.user.id] : [];
    const [rows] = await query(
      `SELECT r.*, c.full_name AS client_name, a.full_name AS advisor_name
       FROM legal_requests r JOIN users c ON c.id=r.client_id
       LEFT JOIN users a ON a.id=r.advisor_id
       ${scope}
       ORDER BY r.created_at DESC`,
      params
    );
    res.json({success:true, requests:rows});
  } catch(e){ fail(res,e,"Unable to load legal requests"); }
};

exports.createRequest = async (req,res) => {
  const {title,category,description,priority="medium"}=req.body||{};
  if(!title?.trim() || !category?.trim() || !description?.trim())
    return res.status(400).json({success:false,message:"Title, category and description are required"});
  if(!["low","medium","high"].includes(priority))
    return res.status(400).json({success:false,message:"Invalid priority"});
  try{
    const [result]=await query(
      "INSERT INTO legal_requests (client_id,title,category,description,priority) VALUES (?,?,?,?,?)",
      [req.user.id,title.trim(),category.trim(),description.trim(),priority]
    );
    const [rows]=await query("SELECT * FROM legal_requests WHERE id=? AND client_id=?",[result.insertId,req.user.id]);
    const [admins] = await query("SELECT id FROM users WHERE role='admin' AND status='active'");
    for (const admin of admins) {
      await query("INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)",
        [admin.id, "New legal request", `${title.trim()} was submitted by a client.`, "/admin/requests"]);
    }
    res.status(201).json({success:true,request:rows[0]});
  }catch(e){fail(res,e,"Unable to create legal request");}
};

exports.updateRequest = async (req,res) => {
  const {status,advisor_id}=req.body||{};
  if(!["pending","in_review","in_progress","completed","rejected"].includes(status))
    return res.status(400).json({success:false,message:"Valid status is required"});
  try{
    if (req.user.role === "advisor") {
      const [owned] = await query("SELECT id FROM legal_requests WHERE id=? AND advisor_id=?", [req.params.id, req.user.id]);
      if (!owned.length) return res.status(404).json({success:false,message:"Assigned legal request not found"});
    }
    if (advisor_id !== undefined && req.user.role !== "admin")
      return res.status(403).json({success:false,message:"Only administrators can assign advisors"});
    if (advisor_id) {
      const [advisor] = await query("SELECT id FROM users WHERE id=? AND role='advisor' AND status='active'", [advisor_id]);
      if (!advisor.length) return res.status(400).json({success:false,message:"Select an active advisor"});
    }
    const hasAdvisorUpdate = Object.prototype.hasOwnProperty.call(req.body || {}, "advisor_id");
    const [result]=await query(
      "UPDATE legal_requests SET status=?, advisor_id=IF(?, ?, advisor_id) WHERE id=?",
      [status, hasAdvisorUpdate ? 1 : 0, advisor_id || null, req.params.id]
    );
    const [updated] = await query("SELECT id FROM legal_requests WHERE id=?", [req.params.id]);
    if(!updated.length) return res.status(404).json({success:false,message:"Legal request not found"});
    if (req.user.role === "admin" && hasAdvisorUpdate) {
      await query("UPDATE consultations SET advisor_id=? WHERE legal_request_id=?", [advisor_id || null, req.params.id]);
    }
    const [matterRows] = await query("SELECT client_id,advisor_id,title FROM legal_requests WHERE id=?", [req.params.id]);
    if (matterRows.length) {
      const matter = matterRows[0];
      const recipients = [matter.client_id, matter.advisor_id].filter(id => id && Number(id) !== Number(req.user.id));
      for (const recipientId of recipients) {
        await query("INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)",
          [recipientId, "Legal matter updated", `${matter.title} status changed to ${status.replaceAll("_", " ")}.`, "/client/requests"]);
      }
    }
    res.json({success:true,message:"Legal request updated"});
  }catch(e){fail(res,e,"Unable to update legal request");}
};

exports.listConsultations = async (req,res) => {
  try{
    const [rows]=await query(
      `SELECT c.*, r.title AS request_title, u.full_name AS advisor_name, cl.full_name AS client_name
       FROM consultations c LEFT JOIN legal_requests r ON r.id=c.legal_request_id
       LEFT JOIN users u ON u.id=c.advisor_id
       LEFT JOIN users cl ON cl.id=c.client_id
       ${req.user.role==="client"?"WHERE c.client_id=?":req.user.role==="advisor"?"WHERE c.advisor_id=?":""}
       ORDER BY c.scheduled_at`,
      ["client","advisor"].includes(req.user.role)?[req.user.id]:[]
    );
    res.json({success:true,consultations:rows});
  }catch(e){fail(res,e,"Unable to load consultations");}
};

exports.createConsultation = async (req,res) => {
  const {scheduled_at,meeting_type="video",notes,legal_request_id}=req.body||{};
  if(!scheduled_at || Number.isNaN(Date.parse(scheduled_at)) || new Date(scheduled_at)<=new Date())
    return res.status(400).json({success:false,message:"Choose a valid future date and time"});
  if (!legal_request_id) return res.status(400).json({success:false,message:"Select a legal request for this consultation"});
  if(!["video","phone","in_person"].includes(meeting_type))
    return res.status(400).json({success:false,message:"Invalid meeting type"});
  try{
    let advisorId = null;
    if (legal_request_id) {
      const [ownedRequest] = await query("SELECT id, advisor_id FROM legal_requests WHERE id=? AND client_id=?", [legal_request_id, req.user.id]);
      if (!ownedRequest.length) return res.status(404).json({success:false,message:"Your legal request was not found"});
      advisorId = ownedRequest[0].advisor_id;
    }
    const [result]=await query(
      "INSERT INTO consultations (client_id,advisor_id,legal_request_id,scheduled_at,meeting_type,notes) VALUES (?,?,?,?,?,?)",
      [req.user.id,advisorId,legal_request_id||null,new Date(scheduled_at),meeting_type,notes||null]
    );
    res.status(201).json({success:true,id:result.insertId,message:"Consultation requested"});
  }catch(e){fail(res,e,"Unable to request consultation");}
};

exports.listMessages = async (req,res) => {
  try{
    const [rows]=await query(
      `SELECT m.*, s.full_name AS sender_name, r.full_name AS recipient_name
       FROM messages m JOIN users s ON s.id=m.sender_id JOIN users r ON r.id=m.recipient_id
       WHERE m.sender_id=? OR m.recipient_id=? ORDER BY m.created_at`,
      [req.user.id,req.user.id]
    );
    res.json({success:true,messages:rows});
  }catch(e){fail(res,e,"Unable to load messages");}
};

exports.sendMessage = async (req,res) => {
  const {recipient_id,body,legal_request_id}=req.body||{};
  if(!recipient_id || !body?.trim()) return res.status(400).json({success:false,message:"Recipient and message are required"});
  try{
    const [users]=await query("SELECT id,role FROM users WHERE id=? AND status='active'",[recipient_id]);
    if(!users.length) return res.status(404).json({success:false,message:"Recipient not found"});
    const [relationship] = await query(
      `SELECT id FROM legal_requests
       WHERE ((client_id=? AND advisor_id=?) OR (client_id=? AND advisor_id=?))
       ${legal_request_id ? "AND id=?" : ""} LIMIT 1`,
      legal_request_id
        ? [req.user.id, recipient_id, recipient_id, req.user.id, legal_request_id]
        : [req.user.id, recipient_id, recipient_id, req.user.id]
    );
    if (!relationship.length) {
      return res.status(403).json({success:false,message:"You can only message a client or advisor connected through an assigned legal request"});
    }
    const [result]=await query("INSERT INTO messages (sender_id,recipient_id,legal_request_id,body) VALUES (?,?,?,?)",
      [req.user.id,recipient_id,legal_request_id||null,body.trim()]);
    await query("INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)",
      [recipient_id, "New message", `You received a message from ${req.user.full_name || "a workspace member"}.`, "/client/messages"]);
    res.status(201).json({success:true,id:result.insertId});
  }catch(e){fail(res,e,"Unable to send message");}
};

exports.getProfile = async (req,res) => {
  try{
    const [rows]=await query(
      `SELECT u.id,u.full_name,u.email,u.phone,u.role,u.created_at,
       p.company_name,p.business_type,p.company_size,p.industry
       FROM users u LEFT JOIN client_profiles p ON p.user_id=u.id WHERE u.id=?`,[req.user.id]);
    if(!rows.length) return res.status(404).json({success:false,message:"Profile not found"});
    res.json({success:true,profile:rows[0]});
  }catch(e){fail(res,e,"Unable to load profile");}
};

exports.updateProfile = async (req,res) => {
  const {full_name,phone,company_name,business_type,company_size,industry}=req.body||{};
  if(!full_name?.trim()) return res.status(400).json({success:false,message:"Full name is required"});
  let conn;
  try{
    conn=await db.promise().getConnection(); await conn.beginTransaction();
    await conn.execute("UPDATE users SET full_name=?,phone=? WHERE id=?",[full_name.trim(),phone||null,req.user.id]);
    if(req.user.role==="client"){
      await conn.execute(
        `INSERT INTO client_profiles (user_id,company_name,business_type,company_size,industry)
         VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE company_name=VALUES(company_name),business_type=VALUES(business_type),company_size=VALUES(company_size),industry=VALUES(industry)`,
        [req.user.id,company_name||null,business_type||null,company_size||null,industry||null]);
    }
    await conn.commit(); res.json({success:true,message:"Profile updated"});
  }catch(e){if(conn) await conn.rollback(); fail(res,e,"Unable to update profile");}
  finally{if(conn) conn.release();}
};

// Return only people connected to the signed-in user's legal matters.
exports.listContacts = async (req, res) => {
  try {
    let rows;
    if (req.user.role === "client") {
      [rows] = await query(
        `SELECT DISTINCT u.id, u.full_name, u.role
         FROM legal_requests r JOIN users u ON u.id=r.advisor_id
         WHERE r.client_id=? AND u.status='active'`, [req.user.id]
      );
    } else if (req.user.role === "advisor") {
      [rows] = await query(
        `SELECT DISTINCT u.id, u.full_name, u.role
         FROM legal_requests r JOIN users u ON u.id=r.client_id
         WHERE r.advisor_id=? AND u.status='active'`, [req.user.id]
      );
    } else {
      [rows] = await query("SELECT id, full_name, role FROM users WHERE id<>? AND status='active' ORDER BY full_name", [req.user.id]);
    }
    res.json({ success: true, contacts: rows });
  } catch (error) {
    fail(res, error, "Unable to load contacts");
  }
};
