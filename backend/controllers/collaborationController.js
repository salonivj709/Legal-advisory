
const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const run = (sql, params = []) => db.promise().execute(sql, params);
const storageRoot = path.join(__dirname, "..", "private_uploads");
const fail = (res, error, message) => {
  console.error(message, error.message);
  return res.status(500).json({ success: false, message });
};

async function canAccessMatter(user, matterId) {
  const [rows] = await run(
    `SELECT id, client_id, advisor_id FROM legal_requests WHERE id=?`,
    [matterId]
  );
  if (!rows.length) return false;
  const matter = rows[0];
  return user.role === "admin" || Number(matter.client_id) === Number(user.id) ||
    Number(matter.advisor_id) === Number(user.id);
}

async function notify(userId, title, body, link = null) {
  if (!userId) return;
  await run("INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)",
    [userId, title, body, link]);
}

exports.listDocuments = async (req, res) => {
  try {
    const matterId = Number(req.query.matterId);
    if (!matterId || !(await canAccessMatter(req.user, matterId)))
      return res.status(404).json({ success: false, message: "Matter not found" });
    const [documents] = await run(
      `SELECT d.id,d.legal_request_id,d.original_name,d.mime_type,d.file_size,d.created_at,
              u.full_name AS uploaded_by_name
       FROM matter_documents d JOIN users u ON u.id=d.uploaded_by
       WHERE d.legal_request_id=? ORDER BY d.created_at DESC`, [matterId]);
    res.json({ success: true, documents });
  } catch (error) { fail(res, error, "Unable to load documents"); }
};

exports.uploadDocument = async (req, res) => {
  const matterId = Number(req.body.legal_request_id);
  if (!matterId || !(await canAccessMatter(req.user, matterId))) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ success: false, message: "Matter not found" });
  }
  if (!req.file) return res.status(400).json({ success: false, message: "Choose a file to upload" });
  try {
    const [result] = await run(
      `INSERT INTO matter_documents
       (legal_request_id,uploaded_by,original_name,stored_name,mime_type,file_size)
       VALUES (?,?,?,?,?,?)`,
      [matterId, req.user.id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size]);
    const [matterRows] = await run("SELECT client_id,advisor_id,title FROM legal_requests WHERE id=?", [matterId]);
    const matter = matterRows[0];
    const recipient = Number(matter.client_id) === Number(req.user.id) ? matter.advisor_id : matter.client_id;
    await notify(recipient, "New matter document", `A document was added to "${matter.title}".`, "/client/documents");
    res.status(201).json({ success: true, id: result.insertId, message: "Document uploaded securely" });
  } catch (error) {
    fs.unlink(req.file.path, () => {});
    fail(res, error, "Unable to save document");
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const [rows] = await run(
      `SELECT d.*,r.client_id,r.advisor_id FROM matter_documents d
       JOIN legal_requests r ON r.id=d.legal_request_id WHERE d.id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Document not found" });
    const doc = rows[0];
    if (![doc.client_id, doc.advisor_id].some(id => Number(id) === Number(req.user.id)) &&
        req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "You cannot access this document" });
    const filePath = path.join(storageRoot, path.basename(doc.stored_name));
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "Stored file is missing" });
    res.download(filePath, doc.original_name);
  } catch (error) { fail(res, error, "Unable to download document"); }
};

exports.listDeadlines = async (req, res) => {
  try {
    const scope = req.user.role === "client" ? "r.client_id=?" :
      req.user.role === "advisor" ? "r.advisor_id=?" : "1=1";
    const params = ["client", "advisor"].includes(req.user.role) ? [req.user.id] : [];
    const [deadlines] = await run(
      `SELECT d.*,r.title AS matter_title,r.client_id,r.advisor_id
       FROM matter_deadlines d JOIN legal_requests r ON r.id=d.legal_request_id
       WHERE ${scope} ORDER BY d.due_at ASC`, params);
    res.json({ success: true, deadlines });
  } catch (error) { fail(res, error, "Unable to load deadlines"); }
};

exports.createDeadline = async (req, res) => {
  const { legal_request_id, title, description, due_at } = req.body || {};
  if (!legal_request_id || !title?.trim() || !due_at || Number.isNaN(Date.parse(due_at)))
    return res.status(400).json({ success: false, message: "Matter, title and a valid due date are required" });
  try {
    const [matters] = await run("SELECT * FROM legal_requests WHERE id=?", [legal_request_id]);
    if (!matters.length) return res.status(404).json({ success: false, message: "Matter not found" });
    const matter = matters[0];
    if (req.user.role === "advisor" && Number(matter.advisor_id) !== Number(req.user.id))
      return res.status(403).json({ success: false, message: "This matter is not assigned to you" });
    if (req.user.role === "client" && Number(matter.client_id) !== Number(req.user.id))
      return res.status(403).json({ success: false, message: "This is not your matter" });
    const [result] = await run(
      "INSERT INTO matter_deadlines (legal_request_id,created_by,title,description,due_at) VALUES (?,?,?,?,?)",
      [legal_request_id, req.user.id, title.trim(), description || null, new Date(due_at)]);
    const otherUser = req.user.role === "client" ? matter.advisor_id : matter.client_id;
    await notify(otherUser, "New matter deadline", `${title.trim()} — ${matter.title}`, "/client/deadlines");
    res.status(201).json({ success: true, id: result.insertId, message: "Deadline created" });
  } catch (error) { fail(res, error, "Unable to create deadline"); }
};

exports.updateDeadline = async (req, res) => {
  const { status } = req.body || {};
  if (!["open", "completed", "cancelled"].includes(status))
    return res.status(400).json({ success: false, message: "Invalid deadline status" });
  try {
    const [rows] = await run(
      `SELECT d.id,r.client_id,r.advisor_id FROM matter_deadlines d
       JOIN legal_requests r ON r.id=d.legal_request_id WHERE d.id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Deadline not found" });
    const item = rows[0];
    if (req.user.role !== "admin" &&
      Number(req.user.id) !== Number(item.client_id) &&
      Number(req.user.id) !== Number(item.advisor_id))
      return res.status(403).json({ success: false, message: "You cannot update this deadline" });
    await run("UPDATE matter_deadlines SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ success: true, message: "Deadline updated" });
  } catch (error) { fail(res, error, "Unable to update deadline"); }
};

exports.listNotifications = async (req, res) => {
  try {
    const [notifications] = await run(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100", [req.user.id]);
    res.json({ success: true, notifications });
  } catch (error) { fail(res, error, "Unable to load notifications"); }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const [result] = await run(
      "UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=? AND user_id=?",
      [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) { fail(res, error, "Unable to update notification"); }
};
