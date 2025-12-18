// src/screens/PaymentWebView.tsx
import React, { useCallback, useRef, useState } from "react";
import {View,ActivityIndicator,StyleSheet,Text,Pressable,} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useRoute, useNavigation, StackActions } from "@react-navigation/native";
import type { RootStackNavProps } from "../navigation/types";
import { useAppDispatch } from "../hooks/reduxHooks";
import { resetCurrent } from "../store/slices/bookingDraft";
import { db } from "../config/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

const PAYMENTS_BASE_URL = "https://hawc-payments-backend.vercel.app";
const COMPLETION_PATH = "/api/payment-complete";

type PaymentWebViewRoute = RootStackNavProps<"PaymentWebView">["route"];

type PaymentResult = {
  kind: "success" | "error";
  title: string;
  message: string;
  goTo: "MyBookings" | "back" | "home";
};

export default function PaymentWebView() {
  const { params } = useRoute<PaymentWebViewRoute>();
  const navigation =
    useNavigation<RootStackNavProps<"PaymentWebView">["navigation"]>();
  const dispatch = useAppDispatch();

  const { checkoutUrl, returnUrl, booking } = params as any;

  const [loading, setLoading] = useState(true);
  const hasCompletedRef = useRef(false);

  const [result, setResult] = useState<PaymentResult | null>(null);

  const handleResultClose = useCallback(() => {
    if (!result) return;

    const target = result.goTo;
    setResult(null);

    if (target === "MyBookings") {
      navigation.dispatch(StackActions.popToTop());
      // @ts-ignore
      navigation.navigate("MyBookings");
    } else if (target === "home") {
      navigation.dispatch(StackActions.popToTop());
      // @ts-ignore
      navigation.navigate("Home");
    } else {
      navigation.goBack();
    }
  }, [navigation, result]);
  

  const finalizeBooking = useCallback(async () => {
    await addDoc(collection(db, "bookings"), {
      userId: booking.userId ?? null,
      userEmail: booking.userEmail ?? null,
      resourceId: booking.resourceId,
      resourceName: booking.resourceName,
      type: booking.type,
      location: booking.location,
      start: booking.startIso,
      end: booking.endIso,
      total: booking.total,
    });

    dispatch(resetCurrent());

    setResult({
      kind: "success",
      title: "Payment successful",
      message: "Your booking has been added.",
      goTo: "MyBookings",
    });
  }, [booking, dispatch]);

  const showErrorResult = useCallback(
    (title: string, message: string) => {
      setResult({
        kind: "error",
        title,
        message,
        goTo: "back",
      });
    },
    []
  );

  const handleNavigationChange = useCallback(
    (navState: WebViewNavigation) => {
      const url = navState.url;

      if (!url || hasCompletedRef.current) {
        return;
      }

      console.log("WebView URL:", url);

      if (url.includes(COMPLETION_PATH)) {
        hasCompletedRef.current = true;

        (async () => {
          try {
            const res = await fetch(
              `${PAYMENTS_BASE_URL}/api/payment-status?id=${encodeURIComponent(
                booking.paymentId
              )}`
            );

            if (!res.ok) {
              console.log("payment-status failed:", res.status);
              showErrorResult(
                "Payment error",
                "Could not verify payment status. Please try again."
              );
              return;
            }

            const statusData = await res.json();
            console.log("Payment status:", statusData);

            const status = statusData.status as string;

            if (status === "paid") {
              await finalizeBooking();
            } else if (status === "canceled") {

              setResult({
                kind: "error",
                title: "Payment canceled",
                message: "You canceled the payment.",
                goTo: "home",
              });
            } else if (status === "failed") {

              showErrorResult(
                "Payment failed",
                "The payment failed. Please try again."
              );
            } else if (status === "expired") {

              showErrorResult(
                "Payment expired",
                "The payment has expired. Please try again."
              );
            } else if (status === "open") {
 
              showErrorResult(
                "Payment not completed",
                "Payment is still open. Please try again."
              );
            } else {
              showErrorResult(
                "Payment error",
                `Unexpected payment status: ${status}.`
              );
            }
          } catch (err) {
            console.log("Error checking payment status:", err);
            showErrorResult(
              "Payment error",
              "Could not verify payment. Please try again."
            );
          }
        })();
      }
    },
    [booking, finalizeBooking, showErrorResult]
  );

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
      />

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {result && (
        <View style={styles.resultOverlay}>
          <View
            style={[
              styles.resultCard,
              result.kind === "success"
                ? styles.resultCardSuccess
                : styles.resultCardError,
            ]}
          >
            <Text
              style={[
                styles.resultTitle,
                result.kind === "success"
                  ? styles.resultTitleSuccess
                  : styles.resultTitleError,
              ]}
            >
              {result.title}
            </Text>
            <Text style={styles.resultMessage}>{result.message}</Text>

            <Pressable style={styles.resultButton} onPress={handleResultClose}>
              <Text style={styles.resultButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  resultCard: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  resultCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a", 
  },
  resultCardError: {
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626", 
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  resultTitleSuccess: {
    color: "#16a34a",
  },
  resultTitleError: {
    color: "#dc2626",
  },
  resultMessage: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
  },
  resultButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },
  resultButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
