import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  hours: number | null;                
  onChange: (h: number) => void;
  step?: number;                      
  min?: number;                    
};

export default function DurationPicker({ hours, onChange, step = 1, min = 1 }: Props) {
  const val = Math.max(min, Number.isFinite(hours as number) ? (hours as number) : min);

  const dec = () => onChange(Math.max(min, val - step));
  const inc = () => onChange(val + step);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Select Duration (hours)</Text>
      <View style={s.row}>
        <TouchableOpacity style={[s.btn, s.left]} onPress={dec}>
          <Text style={s.btnTxt}>−</Text>
        </TouchableOpacity>

        <View style={s.valueBox}>
          <Text style={s.valueTxt}>{val}h</Text>
        </View>

        <TouchableOpacity style={[s.btn, s.right]} onPress={inc}>
          <Text style={s.btnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginTop: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#0b0f19", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  btn: {
    width: 48,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  left: {},
  right: {},
  btnTxt: { fontSize: 22, fontWeight: "900", color: "#0b1220" },
  valueBox: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  valueTxt: { fontSize: 18, fontWeight: "800", color: "#0b1220" },
});
