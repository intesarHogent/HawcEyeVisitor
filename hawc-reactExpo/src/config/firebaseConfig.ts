// src/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import {getFirestore,} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDoilJdWU_zdJJGULeOYGjNvfuWsHcd-Hk",
  authDomain: "hawceyevistorproject.firebaseapp.com",
  projectId: "hawceyevistorproject",
  storageBucket: "hawceyevistorproject.firebasestorage.app",
  messagingSenderId: "47677961750",
  appId: "1:47677961750:web:f0d2008a993ff016eea737",
  measurementId: "G-40ZX6GJKE6",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const db = getFirestore(app);

