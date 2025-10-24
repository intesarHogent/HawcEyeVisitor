// src/screens/ProfileScreen.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import BookingButton from "../components/BookingButton";

const BLUE = "#0d7ff2";

export default function ProfileScreen() {
  // بيانات المستخدم (مؤقتة، ممكن لاحقًا تجي من Firebase)
  const user = {
    name: "John Doe",
    email: "john.doe@hawc.be",
    avatar: "https://i.pravatar.cc/150?img=12",
  };

  const handleLogout = () => {
    console.log("User logged out");
    // TODO: logout logic from Firebase later
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Image source={{ uri: user.avatar }} style={s.avatar} />
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.email}>{user.email}</Text>
      </View>

      <BookingButton
      label="Log out"
      onPress={handleLogout}
      style={{ width: "90%", height: 64, borderRadius: 18, marginTop: 48 }}/>
        </View>
      );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", alignItems: "center", paddingTop: 80 },
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: "85%",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "800", color: "#0b1220" },
  email: { fontSize: 14, color: "#64748b", marginTop: 4 },
});
