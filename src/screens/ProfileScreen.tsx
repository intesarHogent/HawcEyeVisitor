// src/screens/ProfileScreen.tsx
import { View, Text, StyleSheet } from "react-native";
import AppButton from "../components/AppButton";
import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";

// Redux
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { logout } from "../store/slices/auth";

import { auth } from "../../src/config/firebaseConfig";              // ← NEW
import { signOut } from "firebase/auth";                // ← NEW

const BLUE = "#0d7ff2";

export default function ProfileScreen() {
  // المستخدم من الريدكس بدل JSON
  const user = useAppSelector((st) => st.auth.user);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await signOut(auth);                               // ← NEW
    } catch (err) {
      console.log("Firebase logout error:", err);        // ← NEW
    }

    dispatch(logout());                                   // يبقى كما هو
  };

  return (
    <View style={s.container}>
      {/* بطاقة المستخدم */}
      <View style={s.card}>
        <MaterialCommunityIcons
          name="account-circle"
          size={72}
          color={BLUE}
          style={{ marginBottom: 12 }}
        />
        <Text style={s.name}>{user?.name ?? "—"}</Text>
        <Text style={s.email}>{user?.email ?? "—"}</Text>
      </View>

      {/* زر تسجيل الخروج */}
      <AppButton
        label="Log out"
        onPress={handleLogout}
        style={{ width: "90%", height: 64, borderRadius: 18, marginTop: 36 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", alignItems: "center", paddingTop: 60, position: "relative" },
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 50,
    paddingHorizontal: 28,
    width: "88%",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  name: { fontSize: 30, fontWeight: "800", color: "#0b1220", marginBottom: 6 },
  email: { fontSize: 20, color: "#64748b" },
  tagline: { marginBottom: 6, fontSize: 16, fontWeight: "700", color: BLUE, letterSpacing: 0.4, textAlign: "center" },
  tipArea: { alignItems: "center", marginBottom: 24, width: "100%" },
  tipCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eaf2ff", borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, width: "90%" },
  tipText: { color: BLUE, fontSize: 14, fontWeight: "500", flex: 1 },
});
