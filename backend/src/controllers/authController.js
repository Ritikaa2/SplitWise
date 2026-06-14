const bcrypt = require("bcryptjs");
const getPool = require("../utils/getPool");
const { generateToken } = require("../middleware/auth");

const OTP_EXPIRY_MINUTES = 10;

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ error: "Name, email, and password (8+ chars) required" });
    }
    const pool = await getPool();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email.toLowerCase(), hashed]);
    const token = generateToken(result.insertId);
    res.status(201).json({ token, user: { id: result.insertId, name, email: email.toLowerCase() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await getPool();
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email?.toLowerCase()]);
    if (!users.length) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = generateToken(users[0].id);
    res.json({ token, user: { id: users[0].id, name: users[0].name, email: users[0].email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const pool = await getPool();
    const normalizedEmail = String(email).trim().toLowerCase();
    const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);

    if (!users.length) {
      return res.json({ message: "If the email exists, reset instructions have been sent." });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await pool.query("UPDATE password_otps SET used = TRUE WHERE user_id = ? AND used = FALSE", [users[0].id]);
    await pool.query(
      "INSERT INTO password_otps (user_id, otp_hash, expires_at) VALUES (?, ?, ?)",
      [users[0].id, otpHash, expiresAt]
    );

    console.log(`[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`);

    const response = {
      message: "OTP sent to your email",
      expires_in_minutes: OTP_EXPIRY_MINUTES,
    };
    if (process.env.NODE_ENV !== "production") {
      response.dev_otp = otp;
      response.verification_code = otp;
    }
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { otp, password, email } = req.body;
    if (!otp || !password || !email) {
      return res.status(400).json({ error: "Email, OTP, and new password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const pool = await getPool();
    const normalizedEmail = String(email).trim().toLowerCase();
    const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (!users.length) return res.status(400).json({ error: "Invalid or expired OTP" });

    const [otps] = await pool.query(
      `SELECT id, otp_hash FROM password_otps
       WHERE user_id = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [users[0].id]
    );
    if (!otps.length) return res.status(400).json({ error: "Invalid or expired OTP" });

    const validOtp = await bcrypt.compare(String(otp).trim(), otps[0].otp_hash);
    if (!validOtp) return res.status(400).json({ error: "Invalid or expired OTP" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashed, users[0].id]);
    await pool.query("UPDATE password_otps SET used = TRUE WHERE id = ?", [otps[0].id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};
