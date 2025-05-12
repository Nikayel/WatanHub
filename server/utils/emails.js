import { Resend } from 'resend';
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

export const sendContactFormEmail = async ({ name, email, message }) => {
  try {
    const { error } = await resend.emails.send({
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

    if (error) throw error;
    return { status: 200, body: { message: 'Email sent successfully!' } };
  } catch (err) {
    return { status: 500, body: { error: 'Failed to send email.' } };
  }
};

export const sendVerificationEmail = async ({ email, token }) => {
  const verifyUrl = `https://watanhub.vercel.app/verify?token=${token}`;
  try {
    const { error } = await resend.emails.send({
      from: 'WatanHub <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your email address',
      html: `
        <p>Thanks for signing up! Please verify your email by clicking below:</p>
        <p><a href="${verifyUrl}" style="color:blue">Verify My Email</a></p>
      `,
    });

    if (error) throw error;
    return { status: 200, body: { message: 'Verification email sent!' } };
  } catch (err) {
    return { status: 500, body: { error: 'Failed to send verification email.' } };
  }
};

export const sendMentorApprovedEmail = async ({ email, fullName }) => {
  try {
    const { error } = await resend.emails.send({
      from: 'WatanHub <onboarding@resend.dev>',
      to: [email],
      subject: 'Mentor Application Approved!',
      html: `<p>Hi ${fullName},</p><p>Your mentor application has been approved! 🎉</p>`,
    });

    if (error) throw error;
    return { status: 200, body: { message: 'Approval email sent.' } };
  } catch (err) {
    return { status: 500, body: { error: 'Failed to send approval email.' } };
  }
};

export const sendStudentAssignedEmail = async ({ studentEmail, mentorName }) => {
  try {
    const { error } = await resend.emails.send({
      from: 'WatanHub <onboarding@resend.dev>',
      to: [studentEmail],
      subject: "You've been assigned a mentor!",
      html: `<p>You're now paired with mentor <strong>${mentorName}</strong>. Make sure to connect soon!</p>`,
    });

    if (error) throw error;
    return { status: 200, body: { message: 'Student assignment email sent.' } };
  } catch (err) {
    return { status: 500, body: { error: 'Failed to notify student.' } };
  }
};
