// api/create-invoice-booking.js
const { Resend } = require('resend');
const admin = require('firebase-admin');

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = 'intesar.hogent@gmail.com';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}
const db = admin.firestore();

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

    const requestId = metadata.requestId;
    if (!requestId) {
      res.status(400).json({ error: 'metadata.requestId is required for idempotency' });
      return;
    }

    const bookingRef = db.collection('bookings').doc(`invoice_${requestId}`);
    const snap = await bookingRef.get();

    if (!snap.exists) {
      await bookingRef.set({
        userId: metadata.userId ?? null,
        userEmail: realUserEmail ?? null,
        resourceId: metadata.resourceId,
        resourceName: metadata.resourceName,
        type: metadata.type,
        location: metadata.location ?? '',
        start: metadata.startIso,
        end: metadata.endIso,
        total: Number(amount || 0),
        paymentMethod: 'invoice',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailed: false,
      });
    }

    const fresh = await bookingRef.get();
    if (process.env.RESEND_API_KEY && fresh.exists && !fresh.data().emailed) {
      const emailResult = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: TEST_EMAIL,
        subject: 'HAWC booking created (invoice)',
        html: `
          <h2>New invoice booking</h2>
          <p>A booking (invoice mode) was created for <strong>${description || 'HAWC booking'}</strong>.</p>
          <p>Amount: <strong>€${Number(amount || 0).toFixed(2)}</strong></p>
          <p>Original user email: <strong>${realUserEmail}</strong></p>
          <p>Request ID: <strong>${requestId}</strong></p>
        `,
      });

      console.log('Resend invoice emailResult:', emailResult);

      await bookingRef.update({ emailed: true });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('invoice booking error:', err);
    res.status(500).json({ error: 'Failed to create invoice booking' });
  }
};
