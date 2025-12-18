// api/create-invoice-booking.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const TEST_EMAIL = 'intesar.hogent@gmail.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, description, metadata } = req.body || {};

    if (!metadata || !metadata.userId) {
      res.status(400).json({ error: 'metadata.userId is required' });
      return;
    }

    const realUserEmail = metadata.userEmail || metadata.email || 'unknown';

    if (process.env.RESEND_API_KEY) {
      const emailResult = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: TEST_EMAIL,
        subject: 'HAWC booking created (invoice)',
        html: `
          <h2>New invoice booking</h2>
          <p>A booking (invoice mode) was created for <strong>${description || 'HAWC booking'}</strong>.</p>
          <p>Amount: <strong>€${Number(amount || 0).toFixed(2)}</strong></p>
          <p>Original user email: <strong>${realUserEmail}</strong></p>
        `,
      });

      console.log('Resend invoice emailResult:', emailResult);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('invoice email error:', err);
    res.status(500).json({ error: 'Failed to send invoice email' });
  }
};
