// src/screens/BookingSuccessScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AppButton from "../components/AppButton";
import { auth, db } from "../config/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";
import type { Resource } from "../types/env";

// هوك الريدوكس + أكشن مسح الدرافت بالكامل
import { useAppDispatch } from "../hooks/reduxHooks";
import { resetAll } from "../store/slices/bookingDraft";

type BookingSuccessParams = {
  via?: "invoice" | "payment";
  data?: Resource;
  date?: string;
  start?: string;
  end?: string;
  total?: number;
};

const BLUE = "#0d7ff2";

export default function BookingSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as BookingSuccessParams | undefined;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const via = params?.via ?? "payment";

  const dispatch = useAppDispatch();

  // مسح كل مسودات الحجز من الريدوكس بعد الوصول لشاشة النجاح (لمولي و للفاتورة)
  useEffect(() => {
    dispatch(resetAll());
  }, [dispatch]);

  const buildUTC = (d?: string, hm?: string) => {
    if (!d || !hm) return null;
    const [hh, mm] = hm.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const dt = new Date(`${d}T00:00:00Z`);
    dt.setUTCHours(hh, mm, 0, 0);
    return dt;
  };

  // حفظ الحجز في حالة "Invoice later"
  useEffect(() => {
    const saveInvoiceBooking = async () => {
      if (via !== "invoice") {
        setSaved(true);
        return;
      }

      if (
        !params?.data ||
        !params.date ||
        !params.start ||
        !params.end ||
        params.total == null
      ) {
        setError("Missing booking data.");
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You are not logged in.");
        return;
      }

      const s = buildUTC(params.date, params.start);
      const e = buildUTC(params.date, params.end);
      if (!s || !e) {
        setError("Invalid time range.");
        return;
      }

      setSaving(true);
      try {
        await addDoc(collection(db, "bookings"), {
          resourceId: String(params.data.id),
          resourceName: params.data.name,
          type: params.data.type,
          location: (params.data as any).location ?? "",
          start: s.toISOString(),
          end: e.toISOString(),
          total: params.total,
          userId: currentUser.uid,
          userEmail: currentUser.email ?? null,
          paymentMethod: "invoice",
          createdAt: new Date().toISOString(),
        });

        setSaved(true);
      } catch (err) {
        console.log("Failed to save invoice booking:", err);
        setError("Could not save booking.");
      } finally {
        setSaving(false);
      }
    };

    saveInvoiceBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToMyBookings = () => {
    // نصفر الـ stack كله ونخلي أول صفحة هي MyBookings
    // @ts-ignore
    navigation.reset({
      index: 0,
      routes: [{ name: "MyBookings" }],
    });
  };

  const title =
    via === "invoice" ? "Booking confirmed on invoice" : "Payment successful";
  const message =
    via === "invoice"
      ? "Your booking has been confirmed and will be billed on your company account."
      : "Your payment was successful and your booking is confirmed.";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {saving && (
          <>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={[styles.text, { marginTop: 12 }]}>Saving booking…</Text>
          </>
        )}

        {!saving && error && (
          <>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={[styles.text, { color: "#ef4444" }]}>{error}</Text>
          </>
        )}

        {!saving && !error && saved && (
          <>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>{message}</Text>
          </>
        )}
      </View>

      {!saving && (
        <TouchableOpacity
          onPress={goToMyBookings}
          style={{
            width: "100%",
            maxWidth: 300,
            backgroundColor: "#0d7ff2",
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 28,
            shadowColor: "#0d7ff2",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Go to my bookings
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: "#e6eefc",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0b1220",
    textAlign: "center",
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
});
