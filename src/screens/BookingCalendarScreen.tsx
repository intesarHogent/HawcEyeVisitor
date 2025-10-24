// src/screens/BookingCalendarScreen.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RootStackNavProps } from "../navigation/types";
import BookingCalendar from "../components/BookingCalendar";
import DurationPicker from "../components/DurationPicker";



const BLUE = "#0d7ff2";
const LIGHT_BLUE = "#eaf3ff";

// إنشاء أوقات البدء (كل 30 دقيقة)
const makeStartSlots = (step = 30) => {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += step) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
};

export default function BookingCalendarScreen() {
  const navigation = useNavigation<RootStackNavProps<"BookingCalendar">["navigation"]>();
  const { params: { type } } = useRoute<RootStackNavProps<"BookingCalendar">["route"]>();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [start, setStart] = useState<string | null>(null);
  const [hours, setHours] = useState<number>(1); 

  //بدّل الكلمة من داخل الكود إلى اسم مفهوم للمستخدم
  const typeLabel = useMemo(() => (type === "room" ? "Room" : type === "car" ? "Car" : "Parking"), [type]);
  //يشوف إذا المستخدم اختار كل المطلوب (تاريخ، وقت، عدد ساعات)، حتى يقرر إذا الزر يشتغل أو يتعطل
  const canContinue = !!selectedDate && !!start && hours > 0;
  //يصنع جدول أوقات كل نص ساعة،
  //نستخدمها لليوز ميمو لما يكون عندنا قيمة نحسبها بالكود (مو ثابتة) لكن ما نريد نعيد حسابها كل مرة إلا إذا تغيّر شيء مهم فيها
  const startSlots = useMemo(() => makeStartSlots(30), []);

  // عند المتابعة انتقل إلى قائمة الموارد مع المعطيات
  const onContinue = () => {
    if (!canContinue) return;
    navigation.navigate("BookingList", { type, date: selectedDate, start: start!, hours });
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>Choose {typeLabel} date</Text>

      {/* اختيار التاريخ */}
      <BookingCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* اختيار وقت البداية */}
      <View style={s.box}>
        <Text style={s.title}>Select Start Time</Text>
        <FlatList
          data={startSlots}
          keyExtractor={(x) => x}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = start === item;
            return (
              <TouchableOpacity style={[s.chip, active && s.active]} onPress={() => setStart(item)}>
                <Text style={[s.txt, active && s.txtActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* اختيار المدة */}
      <DurationPicker hours={hours} onChange={setHours} step={1} min={1} />

      {/* زر المتابعة */}
      <TouchableOpacity
        onPress={onContinue}
        disabled={!canContinue}
        activeOpacity={0.9}
        style={[s.cta, !canContinue && s.ctaDisabled]}
      >
        <Text style={s.ctaText}>{!canContinue ? "Select date, start, duration" : "Continue"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BLUE, padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0b1220",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  box: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginTop: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#0b0f19", marginBottom: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  active: { backgroundColor: "#eaf3ff", borderColor: BLUE },
  txt: { color: "#0b1220", fontWeight: "600" },
  txtActive: { color: BLUE },
  cta: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLUE,
    marginTop: 12,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaDisabled: { backgroundColor: "#9ec9ff" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
});
