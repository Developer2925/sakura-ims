import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { navBack } from "@/lib/animationStore";
import { useFocusEffect } from "@react-navigation/native";
import { AppIcon, ICONS, getIconBoxColor } from "@/components/AppIcons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { registerTabReload } from "@/lib/tabBarStore";
import { HistorySkeleton } from "@/components/Skeleton";
import { useTheme } from "@/lib/theme";

const TYPE_CONFIG = {
  add: {
    icon: ICONS.addCircle,
    color: null, // will use colors.text at render time
    sign: "+",
  },
  use: {
    icon: ICONS.removeCircle,
    color: "#81807E",
    sign: "-",
  },
  restock: {
    icon: ICONS.archive,
    color: "#8EC8FF",
    sign: "+",
  },
};

function groupByDate(entries) {
  const map = new Map();
  for (const e of entries) {
    const date = e.created_at.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(e);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function formatDate(dateStr, locale) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(iso, locale) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Normalise a delivered restock_request into a unified entry shape
function restockToEntry(r) {
  return {
    id: `rr-${r.id}`,
    type: "restock",
    item_name: r.item_name,
    quantity: r.requested_quantity,
    unit_price: Number(r.unit_price) || 0,
    notes: r.admin_note || null,
    created_at: r.delivered_at,
  };
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const locale = lang === "ja" ? "ja-JP" : "en-US";
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [transactions, setTransactions] = useState([]);
  const [restocks, setRestocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        navBack("/(app)/dashboard");
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  const loadAll = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getTransactions(), api.getRestockRequests()])
      .then(([txRes, rrRes]) => {
        setTransactions(txRes.transactions || []);
        // Only keep delivered requests; skip if already represented as transaction (notes match)
        const delivered = (rrRes.requests || []).filter(
          (r) => r.status === "delivered" && r.delivered_at,
        );
        setRestocks(delivered);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      registerTabReload(loadAll);
    }, [loadAll]),
  );

  // Merge: transactions + delivered restocks (deduplicate by checking notes)
  const allEntries = useMemo(() => {
    const txEntries = transactions.map((t) => ({ ...t, type: t.type }));
    // Exclude transaction entries that are admin restock deliveries (already in restocks list)
    const nonRestockTx = txEntries.filter(
      (t) => t.notes !== "Admin restock delivery",
    );
    const restockEntries = restocks.map(restockToEntry);
    return [...nonRestockTx, ...restockEntries].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [transactions, restocks]);

  const filtered = useMemo(() => {
    if (filter === "all") return allEntries;
    return allEntries.filter((e) => e.type === filter);
  }, [allEntries, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const stats = useMemo(() => {
    const addQty = allEntries
      .filter((e) => e.type === "add")
      .reduce((s, e) => s + e.quantity, 0);
    const useQty = allEntries
      .filter((e) => e.type === "use")
      .reduce((s, e) => s + e.quantity, 0);
    const restockQty = allEntries
      .filter((e) => e.type === "restock")
      .reduce((s, e) => s + e.quantity, 0);
    const useValue = allEntries
      .filter((e) => e.type === "use")
      .reduce((s, e) => s + e.quantity * Number(e.unit_price), 0);
    return { addQty, useQty, restockQty, useValue };
  }, [allEntries]);

  const FILTERS = [
    { key: "all", label: t("all") },
    { key: "add", label: t("added") },
    { key: "use", label: t("used") },
    { key: "restock", label: t("delivered") },
  ];


  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navBack("/(app)/dashboard")}
          activeOpacity={0.8}
        >
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("history")}</Text>
      </View>

      {/* Summary strip */}
      {!loading && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <AppIcon name="addCircle" size={18} />
            <Text style={styles.summaryNum}>{stats.addQty}</Text>
            <Text style={styles.summaryLabel}>{t("added")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <AppIcon name="archive" size={18} color="#8EC8FF" />
            <Text style={[styles.summaryNum, { color: "#8EC8FF" }]}>
              {stats.restockQty}
            </Text>
            <Text style={styles.summaryLabel}>{t("delivered")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <AppIcon name="removeCircle" size={18} />
            <Text style={styles.summaryNum}>{stats.useQty}</Text>
            <Text style={styles.summaryLabel}>{t("used")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <AppIcon name="cash" size={18} />
            <Text style={styles.summaryNum}>¥{stats.useValue.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>{t("usedItems2")}</Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              filter === f.key && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <HistorySkeleton />
      ) : grouped.length === 0 ? (
        <View style={styles.emptyBox}>
          <AppIcon name="time" size={52} />
          <Text style={styles.emptyText}>{t("noHistory")}</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadAll} />
          }
        >
          {grouped.map(({ date, items }) => (
            <View key={date}>
              <Text style={styles.dateLabel}>{formatDate(date, locale)}</Text>
              {items.map((entry) => {
                const cfgBase = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.use;
                const cfg = {
                  ...cfgBase,
                  color: cfgBase.color ?? (entry.type === "add" ? colors.text : colors.textMuted),
                  bg: getIconBoxColor(cfgBase.icon, colors.isDark),
                };
                const unitPrice = Number(entry.unit_price) || 0;
                const value = (entry.quantity * unitPrice).toFixed(2);
                return (
                  <View key={String(entry.id)} style={styles.card}>
                    <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                      <AppIcon name={cfg.icon} size={22} color={cfg.color} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {entry.item_name}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {entry.type === "restock"
                          ? `${t("adminDelivery")} · `
                          : ""}
                        ¥{unitPrice.toFixed(2)} / {t("pieces")} ·{" "}
                        {formatTime(entry.created_at, locale)}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[styles.cardQty, { color: cfg.color }]}>
                        {cfg.sign}
                        {entry.quantity}
                      </Text>
                      <Text style={styles.cardValue}>¥{value}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
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

    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 14,
      backgroundColor: c.surface,
      borderRadius: 18,
      overflow: "hidden",
    },
    summaryCard: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 2 },
    summaryDivider: {
      width: 1,
      height: "60%",
      backgroundColor: "rgba(129,128,126,0.2)",
    },
    summaryNum: { fontSize: 16, fontWeight: "800", color: c.text },
    summaryLabel: { fontSize: 10, color: c.textMuted, fontWeight: "500" },

    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 16,
    },
    filterBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.border,
    },
    filterBtnActive: { backgroundColor: c.text },
    filterText: { fontSize: 12, fontWeight: "600", color: c.textMuted },
    filterTextActive: { color: c.bg },

    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    emptyText: { fontSize: 14, color: c.textMuted },

    listContent: { paddingHorizontal: 20, paddingTop: 4 },
    dateLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 4,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: { flex: 1, marginHorizontal: 12 },
    cardName: { fontSize: 14, fontWeight: "700", color: c.text },
    cardMeta: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    cardRight: { alignItems: "flex-end" },
    cardQty: { fontSize: 17, fontWeight: "800" },
    cardValue: { fontSize: 11, color: c.textMuted, marginTop: 1 },
  });
}
