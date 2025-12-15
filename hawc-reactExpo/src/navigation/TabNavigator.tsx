// src/navigation/TabNavigator.tsx
import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { TabParamsList } from "./types";
import RootStackNavigator from "./RootStackNavigator";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { auth, db } from "../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";

const Tab = createBottomTabNavigator<TabParamsList>();

export default function TabNavigator() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setPendingCount(0);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      const d = snap.exists()
        ? (snap.data() as { userType?: "standard" | "professional" | "admin" })
        : undefined;

      setIsAdmin(d?.userType === "admin");
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    const q = query(collection(db, "users"), where("invoiceApproval", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size));

    return unsub;
  }, [isAdmin]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#0d7ff2",
      }}
    >
      <Tab.Screen
        name="Home"
        component={RootStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
          title: "Home",
        }}
      />

      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          title: "My Bookings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-check" color={color} size={size} />
          ),
        }}
      />

      {isAdmin && (
        <Tab.Screen
          name="AdminInvoice"
          component={RootStackNavigator}
          options={{
            headerShown: false,
            title: "Admin",
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-check" color={color} size={size} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
