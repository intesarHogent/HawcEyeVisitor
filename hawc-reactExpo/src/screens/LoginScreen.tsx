// src/screens/LoginScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import AppButton from "../components/AppButton";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { auth, db } from "../config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const BLUE = "#0d7ff2";
const BG = "#f9fafb";
const LOGO_SIZE = 300;

const schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Min 6 chars").required("Password is required"),
});

export default function LoginScreen() {
  const nav = useNavigation();
  const [hidePass, setHidePass] = useState(true);

  // حركة اللوغو
  const tilt = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(tilt, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(tilt, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [tilt]);
  const rotate = tilt.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] });
  const scale = tilt.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={s.container}
    >
      {/* اللوغو المتحرك */}
      <View pointerEvents="none" style={s.titleWrap}>
        <Animated.View
          style={[s.logoShadow, { transform: [{ perspective: 800 }, { rotateY: rotate }, { scale }] }]}
        >
          <Animated.Image
            source={require("../../assets/hawc_logo.png")}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE, resizeMode: "contain" }}
          />
        </Animated.View>
      </View>

      <View style={s.card}>
        <Text style={s.title}>Welcome</Text>
        <Text style={s.subtitle}>Sign in to continue</Text>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={schema}
          onSubmit={async (v, { setSubmitting }) => {
            try {
              // تسجيل الدخول عبر Firebase
              const cred = await signInWithEmailAndPassword(auth, v.email, v.password);
              const user = cred.user;

              // جلب نوع المستخدم من Firestore (standard / professional)
              const snap = await getDoc(doc(db, "users", user.uid));
              const userData = snap.exists() ? snap.data() : null;
              const userType = (userData?.userType as "standard" | "professional") || "standard";

              console.log("Logged in user type:", userType, "data:", userData);

              // التنقّل: لو عندك onAuthStateChanged في الـ Root يكفي تسجيل الدخول فقط
              // وإلا يمكنك استخدام reset حسب نافيجيتورك:
              // nav.reset({ index: 0, routes: [{ name: "Main" as never }] });

            } catch (error: any) {
              console.log("Firebase login error:", error);
              Alert.alert(
                "Login failed",
                error?.message || "Could not sign in. Please check your email and password."
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isSubmitting,
          }) => {
            const isValid =
              values.email.trim() !== "" &&
              values.password.trim() !== "" &&
              !errors.email &&
              !errors.password;

            return (
              <>
                {/* Email */}
                <View style={s.field}>
                  <Text style={s.label}>Email</Text>
                  <TextInput
                    style={[s.input, touched.email && errors.email ? s.inputErr : null]}
                    placeholder="you@example.com"
                    placeholderTextColor="#94a3b8"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                  {touched.email && errors.email ? (
                    <Text style={s.err}>{errors.email}</Text>
                  ) : null}
                </View>

                {/* Password */}
                <View style={s.field}>
                  <Text style={s.label}>Password</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={[
                        s.input,
                        s.inputWithIcon,
                        touched.password && errors.password ? s.inputErr : null,
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      secureTextEntry={hidePass}
                      autoComplete="password"
                      textContentType="password"
                    />
                    <TouchableOpacity
                      onPress={() => setHidePass(!hidePass)}
                      style={s.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons
                        name={hidePass ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password ? (
                    <Text style={s.err}>{errors.password}</Text>
                  ) : null}
                </View>

                <AppButton
                  label="Sign in"
                  onPress={() => handleSubmit()}
                  disabled={!isValid || isSubmitting}
                  style={s.btn}
                />

                <Text style={s.footer}>
                  Don’t have an account?
                  <Text
                    style={s.link}
                    onPress={() => nav.navigate("Register" as never)}
                  >
                    {" "}
                    Create one
                  </Text>
                </Text>
              </>
            );
          }}
        </Formik>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  titleWrap: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  logoShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: "#e6eefc",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 150,
  },
  title: { fontSize: 26, fontWeight: "900", color: "#0b1220", textAlign: "center" },
  subtitle: { fontSize: 14, color: BLUE, textAlign: "center", marginTop: 6, marginBottom: 22 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6 },
  inputWrap: { position: "relative" },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BLUE,
    backgroundColor: "#eef6ff",
    paddingHorizontal: 12,
    color: "#0b1220",
  },
  inputWithIcon: { paddingRight: 38 },
  eyeBtn: { position: "absolute", right: 10, top: 12 },
  inputErr: { borderColor: "#ef4444", backgroundColor: "#fff" },
  err: { color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: "700" },
  btn: { marginTop: 18 },
  footer: { textAlign: "center", color: BLUE, marginTop: 12 },
  link: { color: BLUE, fontWeight: "800" },
});
