const { createMollieClient } = require('@mollie/api-client');

console.log(
  'MOLLIE_API_KEY exists:',
  !!process.env.MOLLIE_API_KEY,
  'prefix:',
  process.env.MOLLIE_API_KEY ? process.env.MOLLIE_API_KEY.slice(0, 7) : null
);

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY, // من Vercel env
});

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
        value: Number(amount).toFixed(2), // "10.00"
        currency: 'EUR',
      },
      description: description || 'HAWC booking payment',
      redirectUrl: 'https://hawc-payments-backend.vercel.app/api/payment-complete',
      metadata: metadata || {},
    });

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
