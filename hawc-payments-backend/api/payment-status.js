const { createMollieClient } = require('@mollie/api-client');

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY,
});

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  try {
    const payment = await mollieClient.payments.get(id);
    res.status(200).json({
      id: payment.id,
      status: payment.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};
