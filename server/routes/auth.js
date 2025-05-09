import express from 'express';
import { resend } from '../utils/resend.js';
import { supabase } from '../utils/supabase.js';
import { generateToken, verifyToken } from '../utils/emails.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password || !first_name || !last_name)
    return res.status(400).json({ error: 'Missing required fields.' });

  try {
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { first_name, last_name }
    });

    if (error) throw error;

    const token = generateToken(userData.user.id);
    const confirmUrl = `https://yourfrontend.com/verify?token=${token}`;

    await resend.emails.send({
      from: 'WatanHub <no-reply@watanhub.com>',
      to: email,
      subject: 'Verify your WatanHub Email',
      html: `<p>Hello ${first_name}, confirm your email:</p><a href="${confirmUrl}">Verify now</a>`
    });

    res.json({ message: 'Confirmation email sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/confirm', async (req, res) => {
  const { token } = req.query;
  try {
    const { userId } = verifyToken(token);
    await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
    return res.redirect('https://yourfrontend.com/login?verified=true');
  } catch (err) {
    return res.status(400).send('Invalid or expired token.');
  }
});

export default router;
