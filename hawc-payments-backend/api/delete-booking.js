import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ ok: false });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing id" });
  }

  try {
    await admin.firestore().collection("bookings").doc(id).delete();
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Delete booking failed:", e);
    return res.status(500).json({ ok: false });
  }
}
