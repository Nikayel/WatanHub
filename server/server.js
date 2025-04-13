// server/server.js
const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure your Nodemailer transporter
// For Gmail, ensure you use an app-specific password if 2FA is enabled.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// API endpoint to handle contact form submission
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  // Configure your email details
  const mailOptions = {
    from: email, // you can also use your email here
    to: "watanGroup@gmail.com", // destination email
    subject: `Contact Form Submission from ${name}`,
    text: message,
  };

  try {
    // Send email via Nodemailer
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    res.status(200).json({ success: true, info: info.response });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
