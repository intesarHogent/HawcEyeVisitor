// src/screens/ResourceBrowse.tsx
import React from "react";
import { FlatList, StyleSheet, View, TouchableOpacity, Text, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackNavProps } from "../navigation/types";

type Row = { id: "room" | "car" | "parking"; label: string; icon: any };

const DATA: Row[] = [
  { id: "room", label: "Room", icon: "door" },
  { id: "car", label: "Car", icon: "car" },
  { id: "parking", label: "Parking", icon: "parking" },
];

const BLUE = "#0d7ff2";
const LIGHT_BLUE = "#eaf3ff";
const LOGO_SIZE = 200;

// logo 
function HawcVisitorTitle() {
  const tilt = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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
    <View pointerEvents="none" style={styles.titleWrap}>
      <Animated.View
        style={[
          styles.logoShadow,
          { transform: [{ perspective: 800 }, { rotateY: rotate }, { scale }] },
        ]}
      >
        <Animated.Image
          source={require("../../assets/hawc_logo.png")}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE, resizeMode: "contain" }} // لا يوجد tintColor
        />
      </Animated.View>
    </View>
  );
}

export default function ResourceBrowse() {
  const navigation = useNavigation<RootStackNavProps<"ResourceBrowse">["navigation"]>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={["top"]}>
      <FlatList
        data={DATA}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.subtitle}>Choose Type</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("BookingCalendar", { type: item.id })}
            style={styles.card}
            activeOpacity={0.9}
          >
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name={item.icon} size={26} color={BLUE} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
          </TouchableOpacity>
        )}
      />

      <HawcVisitorTitle />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BLUE },

  // تم تكبير الشعار وتحريك بسيط ثلاثي الأبعاد
  titleWrap: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  logoShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },

  listContainer: {
    paddingHorizontal: 16,
    gap: 18,
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingTop: 250, // مساحة أكبر تحت الشعار الكبير
    paddingBottom: 24,
  },

  subtitle: {
    textAlign: "left",
    fontSize: 26,
    fontWeight: "900",
    color: "#0b1220",
    marginBottom: 12,
  },

  card: {
    height: 90,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cfe0ff",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#d6e4ff",
  },
  label: { fontSize: 20, fontWeight: "800", color: "#0b1220", flex: 1 },
});
