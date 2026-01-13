const { createMollieClient } = require("@mollie/api-client");
const { Resend } = require("resend");
const admin = require("firebase-admin");

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = "intesar.hogent@gmail.com";

// ===== Firebase Init (SAFE - no crash) =====
function getDbOrNull() {
  try {
    if (!admin.apps.length) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!raw) {
        console.error("FIREBASE_SERVICE_ACCOUNT is missing in environment variables");
        return null;
      }

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(raw);
      } catch (err) {
        console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
        return null;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    return admin.firestore();
  } catch (err) {
    console.error("Firebase init failed:", err);
    return null;
  }
}

// ===== Handler =====
module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  try {
    const payment = await mollieClient.payments.get(id);

    if (payment.status !== "paid") {
      return res.status(200).json({ id: payment.id, status: payment.status });
    }

    const db = getDbOrNull();
    if (!db) {
      // لا نكسر الفنكشن، نرجّع خطأ واضح
      return res.status(500).json({
        error: "Server misconfigured: FIREBASE_SERVICE_ACCOUNT missing/invalid",
      });
    }

    const md = payment.metadata || {};
    const realUserEmail = md.userEmail || md.email || "unknown";
    const amountValue =
      payment.amount && payment.amount.value ? payment.amount.value : "0.00";
    const desc = payment.description || "HAWC booking";

    const bookingRef = db.collection("bookings").doc(payment.id);
    const snap = await bookingRef.get();

    if (!snap.exists) {
      await bookingRef.set({
        userId: md.userId ?? null,
        userEmail: realUserEmail ?? null,
        resourceId: md.resourceId,
        resourceName: md.resourceName,
        type: md.type,
        location: md.location,
        start: md.startIso,
        end: md.endIso,
        total: amountValue,
        paymentId: payment.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailed: false,
      });
    }

    const fresh = await bookingRef.get();
    if (process.env.RESEND_API_KEY && fresh.exists && !fresh.data().emailed) {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: TEST_EMAIL,
        subject: "HAWC booking payment paid",
        html: `
          <h2>Payment paid</h2>
          <p>Your payment for <strong>${desc}</strong> was paid.</p>
          <p>Amount: <strong>€${amountValue}</strong></p>
          <p>Original user email: <strong>${realUserEmail}</strong></p>
          <p>Payment ID: <strong>${payment.id}</strong></p>
        `,
      });
      await bookingRef.update({ emailed: true });
    }

    return res.status(200).json({
      id: payment.id,
      status: payment.status,
    });
  } catch (err) {
    console.error("payment-status error:", err);
    return res.status(500).json({ error: "Failed to fetch payment status" });
  }
};
