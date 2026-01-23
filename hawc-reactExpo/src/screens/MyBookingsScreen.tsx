// src/screens/MyBookingsScreen.tsx
import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import type { ResourceType } from "../types/env";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { useIsFocused } from "@react-navigation/native";

type Booking = {
  id: string;
  resourceId: string;
  resourceName: string;
  type: ResourceType;
  location?: string;
  start: string;
  end: string;
};

const BLUE = "#0d7ff2";
const RED = "#ef4444";
const GREY = "#94a3b8";

const fmt = (iso: string) => {
  const d = new Date(iso);
  const Y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, "0");
  const D = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setBookings([]);
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Booking[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Booking, "id">),
      }));
      setBookings(list);
    });

    return () => unsub();
  }, [isFocused]);

  const now = Date.now();

  const sorted = useMemo(() => {
    const up: Booking[] = [];
    const past: Booking[] = [];

    for (const b of bookings)
      (new Date(b.end).getTime() > now ? up : past).push(b);

    up.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    past.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    return { up, past };
  }, [bookings, now]);

  const canCancel = (b: Booking) => {
    const start = new Date(b.start).getTime();
    const now = Date.now();
    return start - now >= 24 * 60 * 60 * 1000;
  };

  const cancelBooking = (id: string) => {
    Alert.alert(
      "Confirm cancelation",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(
                `https://hawc-payments-backend.vercel.app/api/delete-booking?id=${id}`,
                { method: "DELETE" }
              );
            } catch (err) {
              console.log("Delete booking error:", err);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = (b: Booking) => {
    const allow = canCancel(b);
    return (
      <View style={s.card}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{b.resourceName}</Text>
          <Text style={s.sub}>
            {b.type.toUpperCase()} • {b.location ?? "-"}
          </Text>
          <Text style={s.when}>
            {fmt(b.start)} → {fmt(b.end)}
          </Text>
        </View>
        <TouchableOpacity
          disabled={!allow}
          onPress={() => cancelBooking(b.id)}
          style={[s.cancelBtn, !allow && s.cancelDisabled]}
        >
          <Text style={s.cancelTxt}>{allow ? "Cancel" : "Locked"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const Section = ({ title, data }: { title: string; data: Booking[] }) => (
    <View style={{ marginTop: 16 }}>
      <Text style={s.section}>{title}</Text>
      {data.length === 0 ? (
        <Text style={s.empty}>No bookings</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => renderItem(item)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <View style={s.container}>
      <Section title="Upcoming" data={sorted.up} />
      <Section title="Past" data={sorted.past} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  section: { fontSize: 18, fontWeight: "800", color: "#0b1220", marginBottom: 8 },
  empty: { color: "#64748b", fontSize: 12, paddingVertical: 8 },
  card: {
    minHeight: 86,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eefc",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "800", color: "#0b1220" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  when: { fontSize: 12, color: "#0b1220", marginTop: 6, fontWeight: "600" },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: RED },
  cancelDisabled: { backgroundColor: GREY },
  cancelTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
