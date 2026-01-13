import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    Alert.alert(
      "Confirm",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "approved" ? "Approve" : "Reject",
          style: status === "rejected" ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", userId), { invoiceApproval: status });
              Alert.alert("Success", `Invoice ${status}`);
            } catch (e) {
              console.log("updateStatus error:", e);
              Alert.alert("Error", String(e));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (allowed === false) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <View style={s.container}>
          <Text style={s.title}>Access denied</Text>
          <Text>You are not allowed to view this page.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (allowed === null) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <View style={s.container}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <View style={s.container}>
        <Text style={s.title}>Invoice approvals</Text>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={() => {}}
          ListEmptyComponent={!loading ? <Text style={s.empty}>No pending requests.</Text> : null}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
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
