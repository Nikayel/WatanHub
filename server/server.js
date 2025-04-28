import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Dynamic CORS setup
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5001',
  'https://watanhub.vercel.app',
  'https://watanhub.onrender.com',
];

// Smarter CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow mobile apps, Postman, or undefined origins (for non-browser requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.startsWith('https://watanhub')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// Body parser
app.use(express.json());

// Setup Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Routes
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

// Health Check Endpoint (optional but nice for mobile & Render monitoring)
app.get('/', (req, res) => {
  res.send('Server is healthy ✅');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
