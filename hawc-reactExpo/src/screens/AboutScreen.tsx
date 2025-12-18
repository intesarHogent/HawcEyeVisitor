import React, { useRef, useState, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, BackHandler, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export default function AboutScreen() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const navigation = useNavigation();


  useFocusEffect(
    useCallback(() => {
      const unsubBeforeRemove = navigation.addListener("beforeRemove", (e) => {
        if (!canGoBack || !webRef.current) return; 
        e.preventDefault();         
        webRef.current.goBack();      
      });

      const unsubHW =
        Platform.OS === "android"
          ? BackHandler.addEventListener("hardwareBackPress", () => {
              if (canGoBack && webRef.current) {
                webRef.current.goBack();
                return true; 
              }
              return false;  
            })
          : { remove: () => {} };

      return () => {
        unsubBeforeRemove();
        unsubHW.remove();
      };
    }, [canGoBack, navigation])
  );

  return (
    <View style={s.container}>
      <WebView
        ref={webRef}
        source={{ uri: "https://hawc-servers.com" }}
        onNavigationStateChange={(st) => setCanGoBack(st.canGoBack)}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator size="large" color="#0d7ff2" style={{ marginTop: 40 }} />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
