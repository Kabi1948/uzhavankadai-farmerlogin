// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Demo database (in-memory)
let farmers = [];

/* ---------------- VALIDATION ---------------- */
function isValidAadhaar(aadhaar) {
  return /^\d{12}$/.test(aadhaar);
}
function isValidBank(bank) {
  return /^\d{9,18}$/.test(bank);
}

/* ---------------- REGISTER ---------------- */
app.post("/api/register", (req, res) => {
  const { username, password, farmName, aadhaar, bank } = req.body;

  if (!username || !password || !farmName || !aadhaar || !bank) {
    return res.json({ success: false, message: "All fields required" });
  }

  if (!isValidAadhaar(aadhaar)) {
    return res.json({ success: false, message: "Invalid Aadhaar number" });
  }

  if (!isValidBank(bank)) {
    return res.json({ success: false, message: "Invalid bank account number" });
  }

  const exists = farmers.find(f => f.username === username);
  if (exists) {
    return res.json({ success: false, message: "Username already exists" });
  }

  farmers.push({
    username,
    password,
    farmName,
    aadhaar,
    bank,
    verified: false
  });

  res.json({ success: true, message: "Registration submitted. Await admin verification." });
});

/* ---------------- LOGIN ---------------- */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const farmer = farmers.find(f => f.username === username && f.password === password);

  if (!farmer) return res.json({ success: false, message: "Invalid credentials" });

  // return verification status
  res.json({ success: true, verified: farmer.verified });
});

/* ---------------- ADMIN VERIFY ---------------- */
app.post("/api/verify", (req, res) => {
  const { username, adminKey } = req.body;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const farmer = farmers.find(f => f.username === username);
  if (!farmer) return res.json({ success: false, message: "Farmer not found" });

  farmer.verified = true;
  res.json({ success: true, message: `${username} verified successfully` });
});

/* ---------------- POST PRODUCT ---------------- */
app.post("/api/post-product", (req, res) => {
  const { username, productName } = req.body;

  const farmer = farmers.find(f => f.username === username);

  if (!farmer || !farmer.verified) {
    return res.status(403).json({
      success: false,
      message: "Only verified farmers can post products"
    });
  }

  res.json({ success: true, message: `Product "${productName}" posted successfully` });
});

/* ---------------- GET PENDING FARMERS ---------------- */
app.get("/api/pending-farmers", (req, res) => {
  const pending = farmers.filter(f => !f.verified);
  res.json(pending);
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));