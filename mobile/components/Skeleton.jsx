import React, { useEffect, useMemo, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";

export function Skeleton({ width, height, borderRadius = 10, style }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.75, duration: 650, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  const bg = colors.isDark ? "#2C2C2C" : "#D8D8D8";

  return (
    <Animated.View
      style={[{ backgroundColor: bg, width: width ?? "100%", height, borderRadius, opacity: anim }, style]}
    />
  );
}

export function DashboardSkeleton() {
  const { colors } = useTheme();
  const sk = useMemo(() => makeSk(colors), [colors]);
  return (
    <View>
      <View style={sk.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={sk.card}>
            <Skeleton width={52} height={52} borderRadius={16} />
            <Skeleton width="60%" height={12} borderRadius={6} style={{ marginTop: 12 }} />
            <Skeleton width="40%" height={10} borderRadius={6} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={sk.txnRow}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
            <Skeleton width="65%" height={12} borderRadius={6} />
            <Skeleton width="40%" height={10} borderRadius={6} />
          </View>
          <Skeleton width={28} height={18} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

export function InventorySkeleton() {
  const { colors } = useTheme();
  const sk = useMemo(() => makeSk(colors), [colors]);
  return (
    <View style={sk.invWrap}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={sk.invCard}>
          <View style={sk.invHeader}>
            <Skeleton width={48} height={48} borderRadius={14} />
            <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
              <Skeleton width="30%" height={10} borderRadius={5} />
              <Skeleton width="65%" height={14} borderRadius={6} />
              <Skeleton width="40%" height={10} borderRadius={5} />
            </View>
            <View style={{ alignItems: "center", gap: 3 }}>
              <Skeleton width={28} height={20} borderRadius={6} />
              <Skeleton width={28} height={10} borderRadius={5} />
            </View>
          </View>
          <View style={sk.invFooter}>
            <Skeleton width="50%" height={11} borderRadius={5} />
            <View style={sk.invActions}>
              <Skeleton width="48%" height={34} borderRadius={10} />
              <Skeleton width="48%" height={34} borderRadius={10} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function HistorySkeleton() {
  const { colors } = useTheme();
  const sk = useMemo(() => makeSk(colors), [colors]);
  const groups = [3, 2, 2];
  return (
    <View style={sk.histWrap}>
      {groups.map((count, gi) => (
        <View key={gi}>
          <Skeleton width={90} height={11} borderRadius={6} style={{ marginBottom: 8, marginTop: gi > 0 ? 4 : 0 }} />
          {Array.from({ length: count }).map((_, ri) => (
            <View key={ri} style={sk.histRow}>
              <Skeleton width={44} height={44} borderRadius={12} />
              <View style={{ flex: 1, marginHorizontal: 12, gap: 6 }}>
                <Skeleton width="60%" height={12} borderRadius={6} />
                <Skeleton width="38%" height={10} borderRadius={6} />
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Skeleton width={32} height={17} borderRadius={6} />
                <Skeleton width={44} height={10} borderRadius={5} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function makeSk(c) {
  return StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 8 },
    card: { width: "47%", height: 138, backgroundColor: c.surface, borderRadius: 22, padding: 18 },
    txnRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: c.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    },
    invWrap: { paddingHorizontal: 20, paddingTop: 4 },
    invCard: { backgroundColor: c.surface, borderRadius: 20, marginBottom: 14, overflow: "hidden" },
    invHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
    invFooter: {
      backgroundColor: c.bg,
      borderTopWidth: 1, borderTopColor: c.border,
      paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    },
    invActions: { flexDirection: "row", justifyContent: "space-between" },
    histWrap: { paddingHorizontal: 20, paddingTop: 4 },
    histRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: c.surface, borderRadius: 16, padding: 12, marginBottom: 8,
    },
  });
}
