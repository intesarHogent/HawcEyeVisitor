// src/screens/BookingListScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RootStackNavProps } from "../navigation/types";
import type { Resource } from "../types/env";
import ResourceListItem from "../components/ResourceListItem";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

type BookingDoc = {
  resourceId: string;
  type: "room" | "car" | "parking";
  start: string;
  end: string;
};

const overlapsRange = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();

const fmt = (d: Date) => {
  const Y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, "0");
  const D = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
};

const fmtHM = (d: Date) =>
  `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;

export default function BookingListScreen() {
  const navigation = useNavigation<RootStackNavProps<"BookingList">["navigation"]>();

  const route = useRoute<RootStackNavProps<"BookingList">["route"]>();
  const params = route.params as
    | { type: "room" | "car" | "parking"; date: string; start: string; hours: number }
    | undefined;

  const type = params?.type;
  const date = params?.date ?? "";
  const start = params?.start ?? "";
  const hours = params?.hours ?? 0;

  const hasValidParams = !!type && !!date && !!start && hours > 0;

  const [resources, setResources] = useState<Resource[]>([]);
  const [bookingsAll, setBookingsAll] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchFromFirestore = async () => {
      try {
        setLoading(true);
        setErrorText(null);

        const roomsSnap = await getDocs(collection(db, "rooms"));
        const rooms = roomsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          type: "room" as const,
        })) as Resource[];

        const parkingsSnap = await getDocs(collection(db, "parkings"));
        const parkings = parkingsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          type: "parking" as const,
        })) as Resource[];

        const carsSnap = await getDocs(collection(db, "cars"));
        const cars = carsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          type: "car" as const,
        })) as Resource[];

        const bookingsSnap = await getDocs(collection(db, "bookings"));
        const bookings = bookingsSnap.docs.map((d) => d.data() as BookingDoc);

        if (alive) {
          setResources([...rooms, ...parkings, ...cars]);
          setBookingsAll(bookings);
        }
      } catch (err) {
        if (alive) {
          setErrorText("Failed to load data. Check your internet connection and try again.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (hasValidParams) {
      fetchFromFirestore();
    } else {
      setLoading(false);
      setErrorText("Missing booking details. Please go back and select date, time, and duration.");
    }

    return () => {
      alive = false;
    };
  }, [hasValidParams]);

  const startDT = useMemo(() => {
    if (!hasValidParams) return new Date(0);
    return new Date(`${date}T${start}:00Z`);
  }, [hasValidParams, date, start]);

  const endDT = useMemo(() => {
    if (!hasValidParams) return new Date(0);
    return new Date(startDT.getTime() + hours * 3600 * 1000);
  }, [hasValidParams, startDT, hours]);

  const endHM = useMemo(() => fmtHM(endDT), [endDT]);

  const filtered = useMemo(() => {
    if (!hasValidParams) return [];

    const out: Resource[] = [];

    for (const r of resources) {
      if (r.type !== type) continue;

      const bookingsForResource = bookingsAll.filter(
        (b) => b.resourceId === String(r.id) && b.type === r.type
      );

      const hasOverlap =
        bookingsForResource.length > 0 &&
        bookingsForResource.some((b) =>
          overlapsRange(startDT, endDT, new Date(b.start), new Date(b.end))
        );

      if (!hasOverlap) {
        const updated = { ...(r as any), availabilityNow: "Available" as const } as Resource;
        out.push(updated);
      }
    }

    return out;
  }, [hasValidParams, resources, type, bookingsAll, startDT, endDT]);

  const endLabel = hasValidParams ? fmt(endDT) : "";
  const iconByType = type === "room" ? "door" : type === "car" ? "car" : "parking";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading...</Text>
      </View>
    );
  }

  if (errorText) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.helperText}>{errorText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {date} {start} → {endLabel} • {hours}h
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontWeight: "800", color: "#0b1220" }}>No available resources</Text>
            <Text style={{ color: "#64748b", marginTop: 4, fontSize: 12 }}>
              Try a different start or duration
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ResourceListItem
            title={item.name}
            subtitle={(item as any).location ?? "-"}
            status="Available"
            iconName={iconByType}
            onPress={() =>
              navigation.navigate("BookingDetail", {
                data: item,
                date,
                start,
                end: endHM,
              })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  badge: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#eaf3ff",
    borderWidth: 1,
    borderColor: "#cfe0ff",
    alignSelf: "flex-start",
  },
  badgeText: { color: "#0b1220", fontWeight: "800", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: "900", color: "#0b1220" },
  helperText: { marginTop: 8, color: "#64748b", textAlign: "center" },
});
