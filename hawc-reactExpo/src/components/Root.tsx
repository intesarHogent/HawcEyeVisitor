// src/screens/Root.tsx

import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { store, persistor } from "../store";

import TabNavigator from "../navigation/TabNavigator";
import AuthStackNavigator from "../navigation/AuthStackNavigator";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

function AppNavigator({ currentUser }: { currentUser: User | null }) {
  return currentUser ? <TabNavigator /> : <AuthStackNavigator />;
}

export default function Root() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return unsub;
  }, []);

  if (authLoading) {
    return (
      <SafeAreaProvider>
        <ActivityIndicator size="large" style={{ marginTop: 80 }} />
      </SafeAreaProvider>
    );
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
