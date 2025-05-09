import express from 'express';
import {
  sendContactFormEmail,
  sendVerificationEmail,
  sendMentorApprovedEmail,
  sendStudentAssignedEmail
} from '../utils/emails.js';

const router = express.Router();

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const result = await sendContactFormEmail({ name, email, message });
  return res.status(result.status).json(result.body);
});

router.post('/verify', async (req, res) => {
  const { email, token } = req.body;
  const result = await sendVerificationEmail({ email, token });
  return res.status(result.status).json(result.body);
});

router.post('/mentor-approved', async (req, res) => {
  const { email, fullName } = req.body;
  const result = await sendMentorApprovedEmail({ email, fullName });
  return res.status(result.status).json(result.body);
});

router.post('/student-assigned', async (req, res) => {
  const { studentEmail, mentorName } = req.body;
  const result = await sendStudentAssignedEmail({ studentEmail, mentorName });
  return res.status(result.status).json(result.body);
});

export default router;
