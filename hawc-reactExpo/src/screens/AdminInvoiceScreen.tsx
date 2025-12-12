import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
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

  const loadPending = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "users"));

    const list: User[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (data.invoiceApproval === "pending") {
        list.push({
          id: d.id,
          fullName: data.fullName,
          email: data.email,
          companyName: data.companyName,
          vat: data.vat,
          invoiceApproval: data.invoiceApproval,
        });
      }
    });

    setUsers(list);
    setLoading(false);
  };

  useEffect(() => {
    if (allowed) loadPending();
  }, [allowed]);

  const updateStatus = async (userId: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        invoiceApproval: status,
      });
      Alert.alert("Success", `Invoice ${status}`);
      loadPending();
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

  // ⏳ تحميل
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
        onRefresh={loadPending}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.fullName}</Text>
            <Text style={s.text}>{item.email}</Text>
            {item.companyName && <Text style={s.text}>{item.companyName}</Text>}
            {item.vat && <Text style={s.text}>VAT: {item.vat}</Text>}

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
