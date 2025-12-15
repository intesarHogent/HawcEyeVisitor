// src/screens/Root.tsx

import React, { useEffect, useState } from "react";
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

SplashScreen.preventAutoHideAsync();

function AppNavigator({ currentUser }: { currentUser: User | null }) {
  return currentUser ? <TabNavigator /> : <AuthStackNavigator />;
}

export default function Root() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAppReady(true);
      SplashScreen.hideAsync();
    });

    return unsub;
  }, []);

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
