// src/screens/RegisterScreen.tsx
import React, { useState } from "react";
import {View,Text,TextInput,StyleSheet,KeyboardAvoidingView,Platform,TouchableOpacity,Alert,} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import AppButton from "../components/AppButton";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { auth } from "../../src/config/firebaseConfig";              // ← NEW
import { createUserWithEmailAndPassword } from "firebase/auth"; // ← NEW

const BLUE = "#0d7ff2";
const BG = "#f9fafb";

const schema = Yup.object({
  name: Yup.string().min(2, "Min 2 chars").required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Min 6 chars").required("Password is required"),
  confirm: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm your password"),
});

export default function RegisterScreen() {
  const nav = useNavigation();
  const [hidePass, setHidePass] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={s.container}
    >
      <View style={s.card}>
        <Text style={s.title}>Create account</Text>
        <Text style={s.subtitle}>Start booking with HAWC Visitor</Text>

        <Formik
          initialValues={{ name: "", email: "", password: "", confirm: "" }}
          validationSchema={schema}
          onSubmit={async (v, { setSubmitting, resetForm }) => {               // ← CHANGED
            try {                                                               // ← NEW
              await createUserWithEmailAndPassword(auth, v.email, v.password);  // ← NEW
              resetForm();                                                      // ← كان موجود لكن الآن بعد النجاح
              // @ts-ignore
              nav.navigate("Login");                                            // ← يبقى نفسه
            } catch (error: any) {
              console.log("Firebase register error:", error);                  // ← NEW
              Alert.alert(
                "Registration failed",
                error?.message || "Could not create account. Please try again."
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
              values.name.trim() !== "" &&
              values.email.trim() !== "" &&
              values.password.trim() !== "" &&
              values.confirm.trim() !== "" &&
              !errors.name &&
              !errors.email &&
              !errors.password &&
              !errors.confirm;

            return (
              <>
                <View style={s.field}>
                  <Text style={s.label}>Full name</Text>
                  <TextInput
                    style={[s.input, touched.name && errors.name ? s.inputErr : null]}
                    placeholder="John Doe"
                    placeholderTextColor="#94a3b8"
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                  />
                  {touched.name && errors.name ? <Text style={s.err}>{errors.name}</Text> : null}
                </View>

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
                  />
                  {touched.email && errors.email ? <Text style={s.err}>{errors.email}</Text> : null}
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
                  {touched.password && errors.password ? <Text style={s.err}>{errors.password}</Text> : null}
                </View>

                {/* Confirm password */}
                <View style={s.field}>
                  <Text style={s.label}>Confirm password</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={[
                        s.input,
                        s.inputWithIcon,
                        touched.confirm && errors.confirm ? s.inputErr : null,
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={values.confirm}
                      onChangeText={handleChange("confirm")}
                      onBlur={handleBlur("confirm")}
                      secureTextEntry={hideConfirm}
                    />
                    <TouchableOpacity
                      onPress={() => setHideConfirm(!hideConfirm)}
                      style={s.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons
                        name={hideConfirm ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.confirm && errors.confirm ? <Text style={s.err}>{errors.confirm}</Text> : null}
                </View>

                <AppButton
                  label="Create account"
                  onPress={() => handleSubmit()}
                  disabled={!isValid || isSubmitting}
                  style={s.btn}
                />

                <Text style={s.footer}>
                  Already have an account?
                  <Text style={s.link} onPress={() => nav.navigate("Login" as never)}> Sign in</Text>
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
    paddingTop: 60,
    paddingHorizontal: 20,
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
  borderColor: BLUE,          // كان #dbe4f3
  backgroundColor: "#eef6ff", // كان #f1f5f9
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
