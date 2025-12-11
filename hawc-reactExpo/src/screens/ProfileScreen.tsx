// src/screens/ProfileScreen.tsx
import { View, Text, StyleSheet } from "react-native";
import AppButton from "../components/AppButton";
import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";

import { auth, db } from "../config/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { useEffect, useState } from "react";

// NEW: Redux لحذف مسودات الحجز عند تسجيل الخروج
import { useAppDispatch } from "../hooks/reduxHooks";
import { resetAll } from "../store/slices/bookingDraft";

const BLUE = "#0d7ff2";

export default function ProfileScreen() {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const dispatch = useAppDispatch();

  // تحميل بيانات المستخدم من Firestore
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setEmail(user.email || "");

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data() as any;
        setFullName(d.fullName || "");
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      // مهم: مسح كل مسودات الحجز المحفوظة في Redux + AsyncStorage
      dispatch(resetAll());
    }
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
        <Text style={s.name}>{fullName || "—"}</Text>
        <Text style={s.email}>{email || "—"}</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    paddingTop: 60,
  },
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
});
