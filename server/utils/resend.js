import { Resend } from 'resend';

let resend;
try {
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.warn('⚠️ Resend API key missing. Email functionality will be mocked for development.');
  resend = {
    emails: {
      send: async (emailData) => {
        console.log('📧 MOCK EMAIL SENT:', emailData);
        return { data: { id: 'mock-email-id' }, error: null };
      }
    }
  };
}

export { resend };
