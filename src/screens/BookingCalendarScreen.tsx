// src/screens/BookingCalendarScreen.tsx
import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RootStackNavProps } from "../navigation/types";
import BookingCalendar from "../components/BookingCalendar";
import DurationPicker from "../components/DurationPicker";
import StartTimePicker from "../components/StartTimePicker";
import BookingButton from "../components/AppButton";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { setType, setDate, setStart, setHours } from "../store/slices/bookingDraft";

const LIGHT_BLUE = "#eaf3ff";
const BLUE = "#0d7ff2";
const DEFAULT_DRAFT = { date: "", start: null as string | null, hours: 1 };

export default function BookingCalendarScreen() {
  const navigation = useNavigation<RootStackNavProps<"BookingCalendar">["navigation"]>();
  const { params: { type } } = useRoute<RootStackNavProps<"BookingCalendar">["route"]>(); // 'room' | 'car' | 'parking'

  const dispatch = useAppDispatch();

  // ثبّت نوع المورد داخل الريدكس
  useEffect(() => {
    dispatch(setType(type));
  }, [type, dispatch]);

  // اقرأ الجذر أولًا ثم اشتق مسودة هذا النوع مع فولباك آمن
  const draftRoot = useAppSelector(s => s.bookingDraft);
  const draftForType = (draftRoot?.byType?.[type]) ?? DEFAULT_DRAFT;

  const typeLabel = useMemo(
    () => (type === "room" ? "Meeting Hall" : type === "car" ? "Car" : "Parking"),
    [type]
  );

  const canContinue = !!draftForType.date && !!draftForType.start && draftForType.hours > 0;

  const onContinue = () => {
    if (!canContinue) return;
    navigation.navigate("BookingList", {
      type,
      date: draftForType.date,
      start: draftForType.start!,
      hours: draftForType.hours,
    });
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>Choose {typeLabel} date</Text>

      {/* اختيار التاريخ */}
      <BookingCalendar
        selectedDate={draftForType.date}
        onSelectDate={(d) => {
          dispatch(setDate({ type, date: d }));
        }}
      />

      {/* اختيار وقت البداية */}
        <StartTimePicker
        value={draftForType.start}
        onChange={(v) => {
          dispatch(setStart({ type, start: v }));
        }}
        step={30}
        date={draftForType.date}  
      />


      {/* اختيار المدة */}
      <DurationPicker
        hours={draftForType.hours}
        onChange={(h) => dispatch(setHours({ type, hours: h }))}
        step={1}
        min={1}
      />

      {/* زر المتابعة */}
      <BookingButton
        label={canContinue ? "Continue" : "Select date, start, duration"}
        disabled={!canContinue}
        onPress={onContinue}
        style={{ marginTop: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BLUE, padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: BLUE, // أزرق بدل الرمادي
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
});
