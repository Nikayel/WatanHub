import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import emailRoutes from './routes/emailRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  'http://localhost:3001',
  'https://watanhub.vercel.app',
  'https://watanhub.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(url => origin.startsWith(url))) {
      callback(null, true);
    } else {
      console.error(`❌ CORS error: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// Create resend instance with fallback for development
let resend;
try {
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.warn('⚠️ Resend API key missing. Email functionality will be mocked for development.');
  // Mock resend for development
  resend = {
    emails: {
      send: async (emailData) => {
        console.log('📧 MOCK EMAIL SENT:', emailData);
        return { data: { id: 'mock-email-id' }, error: null };
      }
    }
  };
}

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'WatanHub Contact <onboarding@resend.dev>',
      to: ['watan8681@gmail.com'],
      subject: `New Contact Form Submission`,
      html: `
        <h2>Message from ${name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      return res.status(500).json({ error: 'Failed to send email.' });
    }

    console.log('✅ Email sent:', data);
    res.status(200).json({ message: 'Email sent successfully!' });

  } catch (err) {
    console.error('❌ Server Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.use('/api/email', emailRoutes); // all email-related endpoints


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
