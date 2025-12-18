import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

const BLUE = "#0d7ff2";

const today = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

type Props = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export default function BookingCalendar({ selectedDate, onSelectDate }: Props) {
  const marked = {
    ...(selectedDate
      ? { [selectedDate]: { selected: true, selectedColor: BLUE, selectedTextColor: "white" } }
      : {}),
  };

  return (
    <View style={s.box}>
      <Text style={s.title}>Select Date</Text>
      <Calendar
        markedDates={marked}
        onDayPress={(day) => onSelectDate(day.dateString)}
        theme={{ selectedDayBackgroundColor: BLUE, todayTextColor: BLUE, arrowColor: BLUE }}
        style={s.calendar}
        minDate={today} 
      />
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0b0f19", marginBottom: 8 },
  calendar: { borderRadius: 12 },
});
