import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppIcon } from "@/components/AppIcons";
import { useTheme } from "@/lib/theme";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatNow() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(now.getDate())} ${MONTHS[now.getMonth()]} ${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function RecordingDate() {
  const { colors } = useTheme();
  const [label, setLabel] = useState(formatNow);

  useEffect(() => {
    const id = setInterval(() => setLabel(formatNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <AppIcon name="time" size={13} />
      <Text style={styles.labelText}>RECORDING</Text>
      <Text style={[styles.date, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#81807E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  date: { fontSize: 13, fontWeight: "600", flex: 1 },
});
