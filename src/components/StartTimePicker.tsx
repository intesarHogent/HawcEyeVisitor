import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";

type Props = {
  value: string | null;                 // الوقت المختار مثل "09:30"
  onChange: (hhmm: string) => void;     // يرجّع الوقت المختار للأب
  step?: number;                        // الدقائق بين كل خيار، افتراضي 30
  startAt?: string;                     // بداية اليوم "00:00"
  endAt?: string;                       // نهاية اليوم "23:30"
  date?: string;                        // تاريخ اليوم المختار "YYYY-MM-DD"
};

const BLUE = "#0d7ff2";

function makeSlots(step = 30, startAt = "00:00", endAt = "23:30") {
  const [sH, sM] = startAt.split(":").map(Number);
  const [eH, eM] = endAt.split(":").map(Number);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;
  const out: string[] = [];
  for (let m = startMin; m <= endMin; m += step) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
}

export default function StartTimePicker({
  value,
  onChange,
  step = 30,
  startAt = "00:00",
  endAt = "23:30",
  date,
}: Props) {
  const slots = useMemo(() => makeSlots(step, startAt, endAt), [step, startAt, endAt]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = now.toISOString().slice(0, 10);
  const isToday = date === todayStr;

  return (
    <View style={s.box}>
      <Text style={s.title}>Select Start Time</Text>
      <FlatList
        data={slots}
        keyExtractor={(x) => x}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => {
          const [h, m] = item.split(":").map(Number);
          const slotMinutes = h * 60 + m;

          // تعطيل الأوقات السابقة فقط إذا التاريخ هو اليوم
          const disabled = isToday && slotMinutes < nowMinutes;

          const active = !disabled && value === item;
          return (
            <TouchableOpacity
              style={[
                s.chip,
                active && s.active,
                disabled && s.disabledChip,
              ]}
              onPress={() => {
                if (!disabled) onChange(item);
              }}
              disabled={disabled}
            >
              <Text
                style={[
                  s.txt,
                  active && s.txtActive,
                  disabled && s.disabledTxt,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
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
  disabledChip: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  disabledTxt: {
    color: "#94a3b8",
  },
});
