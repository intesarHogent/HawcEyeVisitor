import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { collection, onSnapshot, query, where, updateDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";

type User = {
  id: string;
  fullName: string;
  email: string;
  companyName?: string;
  vat?: string;
  invoiceApproval: "pending" | "approved" | "rejected";
};

export default function AdminInvoiceScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  // 🔐 تحقق الأدمن
  useEffect(() => {
    const checkAdmin = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setAllowed(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        setAllowed(false);
        return;
      }

      const data = snap.data() as any;
      setAllowed(data.userType === "admin");
    };

    checkAdmin();
  }, []);

  // ✅ Listen فقط على pending (حتى البادج يختفي/يتحدث مباشرة بدون loadPending)
  useEffect(() => {
    if (!allowed) return;

    setLoading(true);
    const q = query(collection(db, "users"), where("invoiceApproval", "==", "pending"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: User[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            fullName: data.fullName,
            email: data.email,
            companyName: data.companyName,
            vat: data.vat,
            invoiceApproval: data.invoiceApproval,
          };
        });

        setUsers(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
        Alert.alert("Error", "Could not load pending requests");
      }
    );

    return unsub;
  }, [allowed]);

  const updateStatus = async (userId: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "users", userId), { invoiceApproval: status });
      Alert.alert("Success", `Invoice ${status}`);
      // لا تحتاج reload — onSnapshot يحدث القائمة والبادج تلقائياً
    } catch {
      Alert.alert("Error", "Could not update status");
    }
  };

  // 🚫 مو أدمن
  if (allowed === false) {
    return (
      <View style={s.container}>
        <Text style={s.title}>Access denied</Text>
        <Text>You are not allowed to view this page.</Text>
      </View>
    );
  }

  // ⏳ تحميل صلاحية
  if (allowed === null) {
    return (
      <View style={s.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // ✅ أدمن
  return (
    <View style={s.container}>
      <Text style={s.title}>Invoice approvals</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={() => {}}
        ListEmptyComponent={
          !loading ? <Text style={s.empty}>No pending requests.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.fullName}</Text>
            <Text style={s.text}>{item.email}</Text>
            {item.companyName ? <Text style={s.text}>{item.companyName}</Text> : null}
            {item.vat ? <Text style={s.text}>VAT: {item.vat}</Text> : null}

            <View style={s.actions}>
              <TouchableOpacity
                style={[s.btn, s.approve]}
                onPress={() => updateStatus(item.id, "approved")}
              >
                <Text style={s.btnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btn, s.reject]}
                onPress={() => updateStatus(item.id, "rejected")}
              >
                <Text style={s.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16 },
  empty: { color: "#475569", marginTop: 12 },
  card: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "700" },
  text: { fontSize: 13, color: "#475569" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  approve: { backgroundColor: "#22c55e" },
  reject: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "700" },
});
