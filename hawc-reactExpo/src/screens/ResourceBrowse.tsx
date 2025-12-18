// src/screens/ResourceBrowse.tsx
import React from "react";
import { FlatList, StyleSheet, View, Text, Animated, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackNavProps } from "../navigation/types";
import HawcCard from "../components/HawcCard";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Row = { id: "room" | "car" | "parking"; label: string; icon: any };
const DATA: Row[] = [
  { id: "room",    label: "Meeting Hall", icon: "door" },
  { id: "car",     label: "Car",          icon: "car" },
  { id: "parking", label: "Parking",      icon: "parking" },
];

const LIGHT_BLUE = "#eaf3ff";
const BLUE = "#0d7ff2";
const LOGO_SIZE = 300;

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
  const scale  = tilt.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <View pointerEvents="none" style={styles.titleWrap}>
      <Animated.View style={[styles.logoShadow, { transform: [{ perspective: 800 }, { rotateY: rotate }, { scale }] }]}>
        <Animated.Image
          source={require("../../assets/hawc_logo.png")}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE, resizeMode: "contain" }}
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
    <HawcCard
      icon={item.icon}
      title={item.label}
      onPress={() => navigation.navigate("BookingCalendar", { type: item.id })}
      testID={`browse-${item.id}`}
    />
  )}
  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
/>

<TouchableOpacity
  onPress={() => navigation.navigate("About")}
  activeOpacity={0.8}
  style={[styles.aboutRow, { marginBottom: insets.bottom + 50 }]} 
>
  <MaterialCommunityIcons name="information-outline" size={25} color={BLUE} />
  <Text style={styles.aboutText}>About HAWC-Servers</Text>
  <MaterialCommunityIcons name="chevron-right" size={25} color={BLUE} />
</TouchableOpacity>
<HawcVisitorTitle />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BLUE },

  titleWrap: {
    position: "absolute",
    top: 56,
    left: 0, right: 0,
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
    gap: 12,
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingTop: 230,
    paddingBottom: 8,
  },
  subtitle: {
    textAlign: "left",
    fontSize: 26,
    fontWeight: "900",
    color: "#0b1220",
    marginBottom: 12,
  },
  aboutRow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  aboutText: {
    fontSize: 20,
    fontWeight: "700",
    color: BLUE,
    textDecorationLine: "underline",
  },
});
