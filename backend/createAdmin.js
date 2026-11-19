require("dotenv").config();

const db = require("./config/db");
const bcrypt = require("bcrypt");

async function createAdmin() {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error("Admin credentials are missing from .env");
    }

    const [existing] = await db.promise().execute(
      "SELECT id, role FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      throw new Error(
        `Email already exists with role: ${existing[0].role}.`
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().execute(
      `INSERT INTO users
      (full_name, email, password, role, status, email_verified)
      VALUES (?, ?, ?, 'admin', 'active', 1)`,
      [name, email, hashedPassword]
    );

    console.log("Admin account created successfully!");
    console.log("Email:", email);

  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
}

createAdmin();
