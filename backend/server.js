require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const db = require("./config/db");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map(x => x.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Fractional General Counsel API is running" });
});

app.get("/api/health", async (req, res) => {
  try {
    await db.promise().query("SELECT 1");
    const [tables] = await db.promise().query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    res.json({ success: true, database: "connected", tables: tables.map(row => row.TABLE_NAME || row.table_name) });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ success: false, database: "unavailable", message: error.message });
  }
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/workspace", require("./routes/workspaceRoutes"));
app.use("/api/collaboration", require("./routes/collaborationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use((err, req, res, next) => {
  if (err && (err.name === "MulterError" || err.message?.startsWith("Unsupported file type"))) {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error("Unhandled API error:", err.stack || err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

async function initializeDatabase() {
  // Apply the project's idempotent schema at startup. Existing data is preserved:
  // every table uses CREATE TABLE IF NOT EXISTS.
  const schemaPath = path.join(__dirname, "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  const statements = schema
    .split(";")
    .map(statement => statement.trim())
    .filter(statement =>
      statement &&
      !/^CREATE\\s+DATABASE\\b/i.test(statement) &&
      !/^USE\\s+/i.test(statement)
    );

  for (const statement of statements) {
    await db.promise().query(statement);
  }
  await db.promise().query(`CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  console.log("Database schema verified (required tables created if missing).");
}

const PORT = process.env.PORT || 5000;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(error => {
    console.error("Database initialization failed:", error.message);
    console.error("Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME and ensure the database exists.");
    process.exit(1);
  });
