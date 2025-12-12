// src/navigation/RootStackNavigator.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import ResourceBrowse from "../screens/ResourceBrowse";
import BookingListScreen from "../screens/BookingList";
import BookingDetailScreen from "../screens/BookingDetailScreen";
import BookingCalendarScreen from "../screens/BookingCalendarScreen";
import AboutScreen from "../screens/AboutScreen";
import PaymentScreen from "../screens/PaymentScreen";
import PaymentWebView from "../screens/PaymentWebView";
import BookingSuccessScreen from "../screens/BookingSuccess";
import AdminInvoiceScreen from "../screens/AdminInvoiceScreen";


const RootStack = createStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
  return (
    <RootStack.Navigator
      initialRouteName="ResourceBrowse"
      screenOptions={{ headerShown: true }}
    >
      <RootStack.Screen
        name="ResourceBrowse"
        component={ResourceBrowse}
        options={{ headerShown: false, title: "Resources" }}
      />

      <RootStack.Screen
        name="BookingCalendar"
        component={BookingCalendarScreen}
        options={({ route }) => {
          const t = (route.params as { type: "room" | "car" | "parking" }).type;
          const titles = {
            room: "Choose Meeting Hall date",
            car: "Choose Car date",
            parking: "Choose Parking date",
          };
          return { title: titles[t], headerBackTitle: "" };
        }}
      />

      <RootStack.Screen
        name="BookingList"
        component={BookingListScreen}
        options={({ route }) => {
          const { type } = route.params as {
            type: "room" | "car" | "parking";
            date?: string;
          };
          const titles = { room: "Rooms", car: "Cars", parking: "Parking" };
          return { title: titles[type], headerBackTitle: "" };
        }}
      />

      <RootStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ title: "Details", headerBackTitle: "" }}
      />

      <RootStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: "About HAWC-Servers", headerBackTitle: "" }}
      />

      <RootStack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: "Payment", headerBackTitle: "" }}
      />

      <RootStack.Screen
        name="PaymentWebView"
        component={PaymentWebView}
        options={{ title: "Payment" }}
      />

      <RootStack.Screen
        name="BookingSuccess"                  // ← NEW
        component={BookingSuccessScreen}       // ← NEW
        options={{ title: "Booking confirmed", headerBackTitle: "" }} // ← NEW
      />
      <RootStack.Screen
        name="AdminInvoice"
        component={AdminInvoiceScreen}
        options={{ title: "Invoice approvals", headerBackTitle: "" }}
      />

    </RootStack.Navigator>
  );
};

export default RootStackNavigator;
