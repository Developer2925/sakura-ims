import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { navBack } from "@/lib/animationStore";
import { AppIcon, ICONS } from "@/components/AppIcons";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const STATUS_ICONS = {
  pending: "time-outline",
  approved: "checkmark-circle-outline",
  rejected: "close-circle-outline",
  out_for_delivery: "car-outline",
  delivered: "checkmark-done-circle-outline",
};

// 2-variant design: muted for pending/rejected, white for approved/delivered, blue for out_for_delivery
const STATUS_COLORS = {
  pending: {
    bg: "rgba(129,128,126,0.15)",
    fg: "#81807E",
    border: "rgba(129,128,126,0.3)",
  },
  rejected: {
    bg: "rgba(129,128,126,0.15)",
    fg: "#81807E",
    border: "rgba(129,128,126,0.3)",
  },
  approved: {
    bg: "rgba(255,255,255,0.1)",
    fg: "#FFFFFF",
    border: "rgba(255,255,255,0.2)",
  },
  out_for_delivery: {
    bg: "rgba(142,200,255,0.15)",
    fg: "#8EC8FF",
    border: "rgba(142,200,255,0.3)",
  },
  delivered: {
    bg: "rgba(255,255,255,0.1)",
    fg: "#FFFFFF",
    border: "rgba(255,255,255,0.2)",
  },
};

const FILTER_KEYS = [
  "all",
  "pending",
  "rejected",
  "approved",
  "out_for_delivery",
  "delivered",
];

function StatusBadge({ status }) {
  const { t } = useLang();
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <View
      style={[
        badgeStyle.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <AppIcon
        name={STATUS_ICONS[status] ?? "time-outline"}
        size={12}
        color={colors.fg}
      />
      <Text style={[badgeStyle.badgeText, { color: colors.fg }]}>{t(status)}</Text>
    </View>
  );
}

const badgeStyle = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
});

function RequestCard({ req, colors, styles }) {
  const { t } = useLang();
  const date = new Date(req.requested_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>
            {req.item_name}
          </Text>
          <Text style={styles.cardCategory}>{req.category}</Text>
        </View>
        <StatusBadge status={req.status} />
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.metaItem}>
          <AppIcon name="batches" size={13} />
          <Text style={styles.metaText}>
            {t("requestCountLabel")}: {req.requested_quantity}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <AppIcon name="calendar" size={13} />
          <Text style={styles.metaText}>{date}</Text>
        </View>
      </View>
      {req.notes && (
        <View style={styles.notesRow}>
          <AppIcon name="chat" size={12} />
          <Text style={styles.notesText} numberOfLines={2}>
            {req.notes}
          </Text>
        </View>
      )}
      {req.admin_note && (
        <View style={[styles.notesRow, styles.adminNoteRow]}>
          <AppIcon name="person" size={12} />
          <Text
            style={[styles.notesText, { color: colors.text }]}
            numberOfLines={2}
          >
            {req.admin_note}
          </Text>
        </View>
      )}
      {req.status === "out_for_delivery" && (
        <TouchableOpacity
          style={styles.receiveBtn}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/(app)/confirm-delivery",
              params: {
                requestId: req.id,
                itemName: req.item_name,
                quantity: req.requested_quantity,
                unitPrice: req.unit_price ?? 0,
              },
            })
          }
        >
          <AppIcon name="checkCircle" size={16} color="#0F0F0F" />
          <Text style={styles.receiveBtnText}>{t("markAsReceived")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RestockStatusScreen() {
  const { t } = useLang();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadRequests = useCallback(() => {
    setLoading(true);
    api
      .getRestockRequests()
      .then(({ requests: data }) => setRequests(data))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadRequests);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navBack('/(app)/dashboard');
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  const filtered = useMemo(() => {
    return filter === "all"
      ? requests
      : requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            navBack("/(app)/dashboard")
          }
          activeOpacity={0.8}
        >
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("restockStatus")}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <View style={styles.filterRow}>
          {FILTER_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterBtn,
                filter === key && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === key && styles.filterTextActive,
                ]}
              >
                {t(key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <AppIcon name="restock" size={52} />
          <Text style={styles.emptyText}>{t("noRequests")}</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadRequests} />
          }
        >
          {filtered.map((req) => (
            <RequestCard key={req.id} req={req} colors={colors} styles={styles} />
          ))}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 14,
      backgroundColor: c.bg,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      letterSpacing: -0.3,
    },
    filterScroll: { maxHeight: 36, marginBottom: 4 },
    filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8 },
    filterBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.border,
    },
    filterBtnActive: { backgroundColor: c.text },
    filterText: { fontSize: 13, fontWeight: "600", color: c.textMuted },
    filterTextActive: { color: c.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    emptyText: { fontSize: 14, color: c.textMuted },
    listContent: { paddingHorizontal: 20, paddingTop: 8 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      gap: 10,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    cardName: { fontSize: 15, fontWeight: "700", color: c.text },
    cardCategory: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    cardBottom: { flexDirection: "row", gap: 16 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    metaText: { fontSize: 12, color: c.textMuted },
    notesRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    adminNoteRow: { backgroundColor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
    notesText: { fontSize: 12, color: c.textMuted, flex: 1 },
    receiveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#8EC8FF",
      borderRadius: 12,
      paddingVertical: 10,
      marginTop: 2,
    },
    receiveBtnText: { fontSize: 13, fontWeight: "700", color: "#0F0F0F" },
  });
}
