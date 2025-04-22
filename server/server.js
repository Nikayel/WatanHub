import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend'; // Add this

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY); // Initialize Resend

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Updated contact endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // Replace with your domain
      to: ['your-email@example.com'], // Your receiving email
      subject: 'New Contact Form Submission',
      html: `
        <h3>New Message from ${name}</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log('✅ Email sent:', data);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});