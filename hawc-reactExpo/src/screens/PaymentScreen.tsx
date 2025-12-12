// src/screens/PaymentScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RootStackNavProps } from "../navigation/types";
import BookingButton from "../components/AppButton";

// Firestore + Auth
import { auth, db } from "../config/firebaseConfig";
import {
  getDocs,
  collection,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

// Backend base URL (Vercel)
const PAYMENTS_BASE_URL = "https://hawc-payments-backend.vercel.app";
const MOLLIE_RETURN_URL = "https://example.org/return";

export default function PaymentScreen() {
  const { params } = useRoute<RootStackNavProps<"Payment">["route"]>();
  const navigation = useNavigation<RootStackNavProps<"Payment">["navigation"]>();

  const { data, date, start, end, total } = params;
  
  const [invoiceApproval, setInvoiceApproval] = useState<
  "none" | "pending" | "approved" | "rejected">("none");

  // نوع المستخدم (من Firestore)
  const [userType, setUserType] = useState<"standard" | "professional" | "admin">("standard");
  // لمنع الضغط المتكرر على زر Pay later
  const [invoiceBusy, setInvoiceBusy] = useState(false);

  // تحميل نوع الحساب من Firestore
  useEffect(() => {
    const fetchUserType = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
        const d = snap.data() as any;
        setUserType(d.userType || "standard");
        setInvoiceApproval(d.invoiceApproval || "none");
      }

      } catch (err) {
        console.log("Failed to load userType:", err);
      }
    };

    fetchUserType();
  }, []);

  const buildUTC = (d?: string, hm?: string) => {
    if (!d || !hm) return null;
    const [hh, mm] = hm.split(":").map((n) => parseInt(String(n), 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const dt = new Date(`${d}T00:00:00Z`);
    dt.setUTCHours(hh, mm, 0, 0);
    return dt;
  };

  const overlaps = (
    aStart: Date,
    aEnd: Date,
    bStartIso: string,
    bEndIso: string
  ) => {
    const bStart = new Date(bStartIso);
    const bEnd = new Date(bEndIso);
    return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
  };

  const checkConflict = useCallback(
    async (resourceId: string, sIso: string, eIso: string) => {
      const q = query(
        collection(db, "bookings"),
        where("resourceId", "==", resourceId),
        where("start", "<", eIso)
      );

      const snap = await getDocs(q);
      const conflict = snap.docs.some((docSnap) => {
        const d = docSnap.data() as any;
        return overlaps(new Date(sIso), new Date(eIso), d.start, d.end);
      });

      return conflict;
    },
    []
  );

  // الدفع مع Mollie
  const handleContinue = useCallback(async () => {
    if (!date || !start || !end) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You are not logged in. Please sign in again.");
      return;
    }

    const effectiveUserId = currentUser.uid;
    const effectiveUserEmail = currentUser.email ?? null;

    const s = buildUTC(date, start);
    const e = buildUTC(date, end);

    if (!s || !e) {
      Alert.alert("Error", "Invalid time range.");
      return;
    }

    const sIso = s.toISOString();
    const eIso = e.toISOString();

    try {
      const conflict = await checkConflict((data as any).id, sIso, eIso);

      if (conflict) {
        Alert.alert(
          "Time conflict",
          "This resource is already booked in this time range. Please choose another time."
        );
        return;
      }

      const response = await fetch(`${PAYMENTS_BASE_URL}/api/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          description: `Booking ${(data as any).name}`,
          metadata: {
            resourceId: (data as any).id,
            date,
            start,
            end,
            userId: effectiveUserId,
            userEmail: effectiveUserEmail,
          },
        }),
      });

      if (!response.ok) {
        console.log("create-payment failed status:", response.status);
        Alert.alert("Payment error", "Could not initiate payment. Please try again.");
        return;
      }

      const paymentData = await response.json();

      if (!paymentData.checkoutUrl || !paymentData.id) {
        Alert.alert("Payment error", "Invalid payment response.");
        return;
      }

      // @ts-ignore
      navigation.navigate("PaymentWebView", {
        checkoutUrl: paymentData.checkoutUrl,
        returnUrl: MOLLIE_RETURN_URL,
        booking: {
          paymentId: paymentData.id,
          resourceId: (data as any).id,
          resourceName: (data as any).name,
          type: (data as any).type,
          location: (data as any).location ?? "",
          startIso: sIso,
          endIso: eIso,
          total,
          userId: effectiveUserId,
          userEmail: effectiveUserEmail,
        },
      });
    } catch (err) {
      console.log("Failed to start payment:", err);
      Alert.alert("Error", "Could not start payment. Please try again.");
    }
  }, [date, start, end, data, total, checkConflict, navigation]);

  // الفوترة لاحقاً (للمستخدم المهني فقط)
  const handleInvoiceLater = useCallback(async () => {
    if (invoiceBusy) return; // منع الضغط المتكرر

    if (!date || !start || !end) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You are not logged in. Please sign in again.");
      return;
    }

    const s = buildUTC(date, start);
    const e = buildUTC(date, end);

    if (!s || !e) {
      Alert.alert("Error", "Invalid time range.");
      return;
    }

    const sIso = s.toISOString();
    const eIso = e.toISOString();

    try {
      setInvoiceBusy(true);

      // نفس فحص التعارض مثل Mollie
      const conflict = await checkConflict((data as any).id, sIso, eIso);

      if (conflict) {
        Alert.alert(
          "Time conflict",
          "This resource is already booked in this time range. Please choose another time."
        );
        return;
      }

      const res = await fetch(
        "https://hawc-payments-backend.vercel.app/api/create-invoice-booking",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            description: `Invoice booking ${(data as any).name}`,
            metadata: {
              resourceId: (data as any).id,
              date,
              start,
              end,
              userId: currentUser.uid,
              userEmail: currentUser.email ?? null,
            },
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.log("Invoice API error:", res.status, text);
        Alert.alert(
          "Error",
          "Could not create invoice booking (server error). Please try again."
        );
        return;
      }

      const json = await res.json();
      console.log("Invoice API success:", json);

      // @ts-ignore
      navigation.navigate("BookingSuccess", {
        via: "invoice",
        data,
        date,
        start,
        end,
        total,
      });
    } catch (err) {
      console.log("Invoice booking error:", err);
      Alert.alert("Error", "Could not create invoice booking.");
    } finally {
      setInvoiceBusy(false);
    }
  }, [invoiceBusy, date, start, end, data, total, checkConflict, navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Confirm payment</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Resource</Text>
          <Text style={styles.cardValue}>{(data as any).name}</Text>
          {Boolean((data as any).location) && (
            <Text style={styles.cardSubText}>{(data as any).location}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>When</Text>
          <Text style={styles.whenText}>
            {date} • {start} → {end}
          </Text>
        </View>

        <View style={styles.cardAmount}>
          <Text style={styles.cardLabel}>Amount</Text>
          <Text style={styles.amount}>{total.toFixed(2)} €</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Secure online payment</Text>
          <Text style={styles.infoText}>
            You will be redirected to a secure payment page to complete this booking.
          </Text>
        </View>

        {/* STANDARD USER → Mollie only */}
       {/* STANDARD USER → Mollie only */}
          {userType === "standard" && (
            <BookingButton label="Pay with Mollie" onPress={handleContinue} />
          )}

          {/* PROFESSIONAL USER → Mollie + Invoice (حسب الموافقة) */}
          {userType === "professional" && (
            <>
              <BookingButton label="Pay with Mollie" onPress={handleContinue} />

              {invoiceApproval === "approved" && (
                <BookingButton
                  label="Pay later (invoice)"
                  onPress={handleInvoiceLater}
                  style={{ marginTop: 12 }}
                />
              )}

              {invoiceApproval === "pending" && (
                <Text style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>
                  Invoice payment is pending approval.
                </Text>
              )}

              {invoiceApproval === "rejected" && (
                <Text style={{ marginTop: 12, color: "#dc2626", fontSize: 12 }}>
                  Your invoice request was rejected. You must pay online to complete this booking.
                </Text>
              )}
            </>
          )}

          {/* ADMIN USER → Mollie + Invoice بدون شروط */}
          {userType === "admin" && (
            <>
              <BookingButton label="Pay with Mollie" onPress={handleContinue} />
              <BookingButton
                label="Pay later (invoice)"
                onPress={handleInvoiceLater}
                style={{ marginTop: 12 }}
              />
            </>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 16 },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardAmount: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  cardValue: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  cardSubText: { fontSize: 14, color: "#64748b", marginTop: 4 },
  whenText: { fontSize: 14, color: "#1e293b" },
  amount: { fontSize: 24, fontWeight: "800", color: "#2563eb" },
  infoBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: { fontSize: 14, fontWeight: "600", color: "#1d4ed8", marginBottom: 4 },
  infoText: { fontSize: 12, color: "#1d4ed8" },
});
