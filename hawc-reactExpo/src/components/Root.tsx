// src/screens/Root.tsx

import React, { useEffect, useState, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import * as SplashScreen from "expo-splash-screen";

import { store, persistor } from "../store";
import TabNavigator from "../navigation/TabNavigator";
import AuthStackNavigator from "../navigation/AuthStackNavigator";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

// امنع إخفاء السبلاش تلقائيًا
SplashScreen.preventAutoHideAsync();

function AppNavigator({ currentUser }: { currentUser: User | null }) {
  return currentUser ? <TabNavigator /> : <AuthStackNavigator />;
}

export default function Root() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appReady, setAppReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // نلغي أي تايمر سابق
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // نأخر اتخاذ القرار شوي حتى تستقر حالة Firebase
      timeoutRef.current = setTimeout(() => {
        setCurrentUser(user);
        setAppReady(true);
        SplashScreen.hideAsync();
      }, 300); // 300ms كافية لمنع الفليكر
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unsub();
    };
  }, []);

  // أثناء التحميل خلي السبلاش ظاهر
  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NavigationContainer>
            <AppNavigator currentUser={currentUser} />
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}
