// api/create-invoice-booking.js
const { Resend } = require("resend");
const admin = require("firebase-admin");

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = "intesar.hogent@gmail.com";

// ===== Firebase Init (SAFE) =====
function getDbOrNull() {
  try {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        console.error(
          "Missing Firebase env vars (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)"
        );
        return null;
      }

      // Important: Vercel stores newlines as \n
      privateKey = privateKey.replace(/\\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    return admin.firestore();
  } catch (err) {
    console.error("Firebase init failed:", err);
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = getDbOrNull();
    if (!db) {
      return res.status(500).json({
        error:
          "Server misconfigured: Missing/invalid Firebase env vars (PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)",
      });
    }

    // Sometimes body comes as string
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { amount, description, metadata } = body;

    if (!metadata || !metadata.userId) {
      return res.status(400).json({ error: "metadata.userId is required" });
    }

    const requestId = metadata.requestId;
    if (!requestId) {
      return res.status(400).json({ error: "metadata.requestId is required for idempotency" });
    }

    const realUserEmail = metadata.userEmail || metadata.email || "unknown";

    const bookingRef = db.collection("bookings").doc(`invoice_${requestId}`);
    const snap = await bookingRef.get();

    if (!snap.exists) {
      await bookingRef.set({
        userId: metadata.userId ?? null,
        userEmail: realUserEmail ?? null,
        resourceId: metadata.resourceId ?? null,
        resourceName: metadata.resourceName ?? null,
        type: metadata.type ?? null,
        location: metadata.location ?? "",
        start: metadata.startIso ?? null,
        end: metadata.endIso ?? null,
        total: Number(amount || 0),
        paymentMethod: "invoice",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailed: false,
      });
    }

    const fresh = await bookingRef.get();
    if (process.env.RESEND_API_KEY && fresh.exists && !fresh.data().emailed) {
      const emailResult = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: TEST_EMAIL,
        subject: "HAWC booking created (invoice)",
        html: `
          <h2>New invoice booking</h2>
          <p>A booking (invoice mode) was created for <strong>${description || "HAWC booking"}</strong>.</p>
          <p>Amount: <strong>€${Number(amount || 0).toFixed(2)}</strong></p>
          <p>Original user email: <strong>${realUserEmail}</strong></p>
          <p>Request ID: <strong>${requestId}</strong></p>
        `,
      });

      console.log("Resend invoice emailResult:", emailResult);
      await bookingRef.update({ emailed: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("invoice booking error:", err);
    return res.status(500).json({ error: "Failed to create invoice booking" });
  }
};
