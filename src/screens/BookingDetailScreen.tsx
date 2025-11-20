// src/screens/BookingDetailScreen.tsx
import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Alert, Animated } from "react-native";
import { useRoute, useNavigation, StackActions } from "@react-navigation/native";
import type { RootStackNavProps } from "../navigation/types";
import type { Resource } from "../types/env";
import BookingButton from "../components/AppButton";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";

const CTA_H = 72;


export default function BookingDetailScreen() {
  const {
    params: { data, date, start, end },
  } = useRoute<RootStackNavProps<"BookingDetail">["route"]>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const item = data as Resource;
  const pricePerHour = (item as any).pricePerHour ?? 0;

  const user = useAppSelector((state) => state.auth.user);


  // ===== ANIMATION للتحذير =====
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);
  // =============================

  // دالة تحسب وقت البداية والنهاية لتحديد عدد الساعات
  const buildUTC = (d?: string, hm?: string) => {
    if (!d || !hm) return null;
    const [hh, mm] = hm.split(":").map((n) => parseInt(String(n), 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const dt = new Date(`${d}T00:00:00Z`);
    dt.setUTCHours(hh, mm, 0, 0);
    return dt;
  };

  // تحقق من الاكتمال
  const hasSelection = !!(date && start && end);

  // عدد الساعات
  const hoursInt = useMemo(() => {
    if (!hasSelection) return null;
    const s = buildUTC(date, start);
    const e = buildUTC(date, end);
    if (!s || !e) return null;
    const diffMs = e.getTime() - s.getTime();
    if (diffMs <= 0) return null;
    return diffMs / 3_600_000;
  }, [hasSelection, date, start, end]);

  // الإجمالي
  const total = useMemo(
    () => (hoursInt == null ? null : hoursInt * pricePerHour),
    [hoursInt, pricePerHour]
  );

  const canBook = !!(hasSelection && pricePerHour > 0 && hoursInt != null);

  // helper للتداخل بين فترتين
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

  // عند الحجز
  const onBook = () => {
  if (!canBook || !date || !start || !end || total == null) return;

  if (!user) {
    Alert.alert("Not logged in", "Please log in first.");
    return;
  }

  // @ts-ignore
  navigation.navigate("Payment", {
    data: item,
    date,
    start,
    end,
    total,
    userId: user.id,
    userEmail: user.email,
  });
};


  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        style={s.wrap}
        contentContainerStyle={[s.cc, { paddingBottom: CTA_H + 24 }]}
      >
        {!!(item as any).image && (
          <Image
            source={{ uri: (item as any).image }}
            style={s.img}
            resizeMode="cover"
          />
        )}

        <View style={s.header}>
          <Text style={s.title}>{(item as any).name}</Text>
          {(item as any).location ? (
            <Text style={s.sub}>{(item as any).location}</Text>
          ) : null}
          {(item as any).description ? (
            <Text style={s.desc}>{(item as any).description}</Text>
          ) : null}
          {hasSelection && (
            <Text style={s.hint}>
              {date} • {start} → {end}
            </Text>
          )}
        </View>

        {((item as any).type === "room") && (
          <Section title="Room Info">
            <Row label="Capacity" value={String((item as any).capacity ?? "-")} />
            <Row
              label="Equipment"
              value={
                (item as any).equipment?.length
                  ? (item as any).equipment.join(", ")
                  : "-"
              }
            />
          </Section>
        )}

        {((item as any).type === "car") && (
          <Section title="Car Info">
            <Row label="Plate" value={(item as any).plate ?? "-"} />
            <Row label="Fuel" value={(item as any).fuel ?? "-"} />
            <Row
              label="Range"
              value={(item as any).rangeKm ? `${(item as any).rangeKm} km` : "-"}
            />
          </Section>
        )}

        {((item as any).type === "parking") && (
          <Section title="Parking Info">
            <Row label="Covered" value={(item as any).covered ? "Yes" : "No"} />
            <Row
              label="EV charger"
              value={(item as any).evCharger ? "Yes" : "No"}
            />
          </Section>
        )}

        <Section title="Pricing">
          <Row
            label="Price per hour"
            value={pricePerHour ? `${pricePerHour.toFixed(2)} €` : "—"}
          />
          <Row
            label={hoursInt != null ? `Total (${hoursInt} h)` : "Total"}
            value={total != null ? `${total.toFixed(2)} €` : "—"}
          />
          {hasSelection && total == null && (
            <Text style={s.note}>Invalid time range.</Text>
          )}
        </Section>

        <View style={{ height: 8 }} />
      </ScrollView>

      <View style={s.ctaWrap}>
        {/* تحذير الإلغاء قبل 24 ساعة */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: "#facc15",
              fontWeight: "700",
              textAlign: "center",
              fontSize: 12,
            }}
          >
            Cancellation is only allowed up to 24 hours before the booking time.
          </Text>
        </Animated.View>

        <BookingButton label="Book now" disabled={!canBook} onPress={onBook} />
      </View>
    </View>
  );
}

// تنظيم الأقسام
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.h2}>{title}</Text>
      {children}
    </View>
  );
}

// صف داخل القسم
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
  cc: { paddingBottom: 0 },
  img: { width: "100%", height: 240 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 0 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 6,
    color: "#0b0f19",
  },
  sub: { fontSize: 15, color: "#4b5563", marginBottom: 0 },
  desc: { fontSize: 16, color: "#111827", lineHeight: 23 },
  hint: { marginTop: 6, fontSize: 13, color: "#475569", fontWeight: "600" },
  section: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  h2: { fontSize: 18, fontWeight: "700", marginBottom: 0, color: "#0b0f19" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: { fontSize: 15, color: "#374151", fontWeight: "600" },
  value: { fontSize: 15, color: "#111827" },
  note: { marginTop: 6, fontSize: 12, color: "#64748b", fontWeight: "600" },
  ctaWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
});
