const { createMollieClient } = require('@mollie/api-client');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY,
});

const TEST_EMAIL = 'intesar.hogent@gmail.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, description, metadata } = req.body;

    if (!amount) {
      res.status(400).json({ error: 'amount is required' });
      return;
    }

    const payment = await mollieClient.payments.create({
      amount: {
        value: Number(amount).toFixed(2),
        currency: 'EUR',
      },
      description: description || 'HAWC booking payment',
      redirectUrl: 'https://hawc-payments-backend.vercel.app/api/payment-complete',
      metadata: metadata || {},
    });

    try {
      const realUserEmail = metadata?.userEmail || metadata?.email || 'unknown';

      const targetEmail = TEST_EMAIL;

      if (process.env.RESEND_API_KEY) {
        const emailResult = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: targetEmail,
          subject: 'HAWC booking payment created',
          html: `
            <h2>Payment created</h2>
            <p>Your payment for <strong>${description || 'HAWC booking'}</strong> was created.</p>
            <p>Amount: <strong>€${Number(amount).toFixed(2)}</strong></p>
            <p>Original user email: <strong>${realUserEmail}</strong></p>
          `,
        });

        console.log('Resend emailResult:', emailResult);
      }
    } catch (emailErr) {
      console.error('Resend email error:', emailErr);
    }

    res.status(200).json({
      id: payment.id,
      status: payment.status,
      checkoutUrl: payment._links.checkout.href,
    });
  } catch (err) {
    console.error(
      'Mollie error:',
      err && err.statusCode,
      err && err.message
    );
    const status = err && err.statusCode ? err.statusCode : 500;
    res.status(status).json({ error: 'Failed to create payment' });
  }
};
