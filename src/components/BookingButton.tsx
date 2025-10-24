import React, { useRef } from "react";
import { Pressable, Animated, Text, StyleSheet, ViewStyle } from "react-native";

const BLUE = "#0d7ff2";

type Props = {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function BookingButton({ label, disabled, onPress, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();

 return (
  <Animated.View style={[style, { transform: [{ scale }] }]}>
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      style={[s.btn, disabled && s.disabled]} // لا تمرر style هنا
      disabled={disabled}
    >
      <Text style={s.text}>{label}</Text>
    </Pressable>
  </Animated.View>
);
}

const s = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  disabled: {
    backgroundColor: "#94a3b8",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
