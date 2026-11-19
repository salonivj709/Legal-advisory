
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const c = require("../controllers/collaborationController");

const uploadDir = path.join(__dirname, "..", "private_uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const allowedMimeTypes = new Set([
  "application/pdf", "image/png", "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain"
]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${require("crypto").randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
const uploader = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) return cb(new Error("Unsupported file type. Upload PDF, DOC, DOCX, XLSX, PNG, JPG or TXT."));
    cb(null, true);
  }
});

router.use(verifyToken);
router.get("/documents", c.listDocuments);
router.post("/documents", uploader.single("document"), c.uploadDocument);
router.get("/documents/:id/download", c.downloadDocument);
router.get("/deadlines", c.listDeadlines);
router.post("/deadlines", c.createDeadline);
router.patch("/deadlines/:id", c.updateDeadline);
router.get("/notifications", c.listNotifications);
router.patch("/notifications/:id/read", c.markNotificationRead);
module.exports = router;
