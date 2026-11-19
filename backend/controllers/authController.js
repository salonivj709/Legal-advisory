const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { full_name, email, phone, password, company_name, business_type, company_size, industry } = req.body || {};
  if (!full_name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must contain at least 8 characters" });
  }
  const normalizedEmail = email.trim().toLowerCase();
  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, 'client')",
      [full_name.trim(), normalizedEmail, phone?.trim() || null, hashedPassword]
    );
    await connection.execute(
      "INSERT INTO client_profiles (user_id, company_name, business_type, company_size, industry) VALUES (?, ?, ?, ?, ?)",
      [result.insertId, company_name || null, business_type || null, company_size || null, industry || null]
    );
    await connection.commit();
    return res.status(201).json({ success: true, message: "Client registered successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ success: false, message: "Email already registered" });
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, message: "Registration failed" });
  } finally {
    if (connection) connection.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }
  try {
    const [users] = await db.promise().execute(
      "SELECT id, full_name, email, password, role, status FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );
    if (!users.length) return res.status(401).json({ success: false, message: "Invalid email or password" });
    const user = users[0];
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (user.status !== "active") return res.status(403).json({ success: false, message: "Your account is not active" });
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
    return res.json({
      success: true, message: "Login successful", token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};
