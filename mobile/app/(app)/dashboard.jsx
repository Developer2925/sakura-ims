import { DashboardSkeleton } from "@/components/Skeleton";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AppLogo } from "@/components/AppLogo";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useAlert } from "@/components/AlertModal";
import { useTheme } from "@/lib/theme";
import { AppIcon, ICONS, getIconBoxColor } from "@/components/AppIcons";
import { registerTabReload } from "@/lib/tabBarStore";
import { navForward } from "@/lib/animationStore";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOW_STOCK = 100; // Threshold for low stock items

export default function DashboardScreen() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const TX_CONFIG = {
    add: {
      icon: ICONS.addCircle,
      color: colors.text,
      bg: getIconBoxColor("addCircle", colors.isDark),
      sign: "+",
    },
    use: {
      icon: ICONS.removeCircle,
      color: colors.textMuted,
      bg: getIconBoxColor("removeCircle", colors.isDark),
      sign: "-",
    },
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    pendingRequests: 0,
    deliveredThisMonth: 0,
  });
  const [recentTxns, setRecentTxns] = useState([]);
  const [outForDelivery, setOutForDelivery] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        showAlert(
          t("exitAppTitle"),
          t("exitAppMsg"),
          [
            { text: t("stayApp"), style: "cancel" },
            {
              text: t("exitApp"),
              style: "destructive",
              onPress: () => BackHandler.exitApp(),
            },
          ],
          "confirm",
        );
        return true;
      });
      return () => sub.remove();
    }, [t, showAlert]),
  );

  const loadStats = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [invRes, reqRes, txRes] = await Promise.all([
        api.getInventory(),
        api.getRestockRequests(),
        api.getTransactions(),
      ]);
      api
        .getNotifications()
        .then((r) => setNotifications(r.notifications))
        .catch(() => {});
      const items = invRes.items;
      const requests = reqRes.requests;
      const thisMonth = new Date().toISOString().slice(0, 7);
      setStats({
        total: items.length,
        lowStock: items.filter((i) => i.quantity <= LOW_STOCK).length,
        pendingRequests: requests.filter((r) => r.status === "pending").length,
        deliveredThisMonth: requests.filter(
          (r) =>
            r.status === "delivered" && r.delivered_at?.startsWith(thisMonth),
        ).length,
      });
      setOutForDelivery(
        requests.filter((r) => r.status === "out_for_delivery"),
      );
      setRecentTxns(txRes.transactions.slice(0, 5));
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      registerTabReload(() => {
        setLoading(true);
        loadStats();
      });
    }, [loadStats]),
  );

  const INSIGHTS = [
    {
      labelKey: "inventoryItems",
      sub: `${stats.total}`,
      icon: "item",
      onPress: () => navForward("/(app)/inventory"),
    },
    {
      labelKey: "lowStock",
      sub: `${stats.lowStock}`,
      icon: "warning",
      onPress: () => navForward("/(app)/inventory"),
    },
    {
      labelKey: "pendingRequests",
      sub: `${stats.pendingRequests}`,
      icon: "restock",
      onPress: () => navForward("/(app)/restock-status"),
    },
    {
      labelKey: "deliveredThisMonth",
      sub: `${stats.deliveredThisMonth}`,
      icon: "checkDone",
      onPress: () => navForward("/(app)/stocks-received"),
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <AppLogo size="small" />
        <Text style={styles.clinicName} numberOfLines={1}>
          {(() => {
            const name = user?.organizationName ?? "";
            const parts = name.split("|");
            return lang === "ja"
              ? parts[0]?.trim() || name
              : parts[1]?.trim() || name;
          })()}
        </Text>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setShowNotifications(true)}
          activeOpacity={0.8}
        >
          <AppIcon name="notifications" size={24} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navForward("/(app)/settings")}
          activeOpacity={0.8}
        >
          <AppIcon name="toggles" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              loadStats();
            }}
          />
        }
      >
        <Text style={styles.sectionTitle}>{t("insights")}</Text>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <View style={styles.grid}>
            {INSIGHTS.map((ins) => (
              <TouchableOpacity
                key={ins.labelKey}
                style={styles.card}
                onPress={ins.onPress}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: getIconBoxColor(ins.icon, colors.isDark),
                    },
                  ]}
                >
                  <AppIcon name={ins.icon} size={26} />
                </View>
                <Text style={styles.cardLabel}>{t(ins.labelKey)}</Text>
                <Text style={styles.cardSub}>
                  {ins.sub} {t("items")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Out for Delivery */}
        {!loading && outForDelivery.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navForward("/(app)/restock-status")}
          >
            <View style={styles.deliveryBanner}>
              <View style={styles.deliveryBannerHeader}>
                <View style={styles.deliveryIconBox}>
                  <AppIcon name="car" size={18} color="#1D6FA4" />
                </View>
                <Text style={styles.deliveryBannerTitle}>
                  {t("outForDeliveryTitle")}
                </Text>
                <View style={styles.deliveryBadge}>
                  <Text style={styles.deliveryBadgeText}>
                    {outForDelivery.length}
                  </Text>
                </View>
                <AppIcon
                  name="forward"
                  size={16}
                  color="#1D6FA4"
                  style={{ marginLeft: "auto" }}
                />
              </View>
              {outForDelivery.map((req) => (
                <View key={req.id} style={styles.deliveryRow}>
                  <AppIcon name="item" size={14} color="#1D6FA4" />
                  <Text style={styles.deliveryItemName} numberOfLines={1}>
                    {req.item_name}
                  </Text>
                  <Text style={styles.deliveryMeta}>
                    {t("outForDeliveryQty")}: {req.requested_quantity}
                    {req.shipped_at
                      ? `  ·  ${t("outForDeliveryShipped")}: ${new Date(req.shipped_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : ""}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Recent Transactions */}
        {!loading && (
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t("recentTransactions")}</Text>
            <TouchableOpacity
              onPress={() => navForward("/(app)/history")}
              activeOpacity={0.7}
              style={styles.arrowBtn}
            >
              <AppIcon name="arrowRight" size={18} />
            </TouchableOpacity>
          </View>
        )}

        {!loading && recentTxns.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppIcon name="time" size={40} />
            <Text style={styles.emptyText}>{t("noTransactions")}</Text>
          </View>
        ) : !loading ? (
          recentTxns.map((tx) => {
            const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.use;
            return (
              <View key={tx.id} style={styles.recentRow}>
                <View style={[styles.txnDot, { backgroundColor: cfg.bg }]}>
                  <AppIcon name={cfg.icon} size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txnName} numberOfLines={1}>
                    {tx.item_name}
                  </Text>
                  <Text style={styles.txnMeta}>
                    {tx.type === "add" ? t("added") : t("used")} · ¥
                    {Number(tx.unit_price).toFixed(2)}
                  </Text>
                </View>
                <Text style={[styles.txnQty, { color: cfg.color }]}>
                  {cfg.sign}
                  {tx.quantity}
                </Text>
              </View>
            );
          })
        ) : null}

        <View style={{ height: 110 }} />
      </ScrollView>

      <NotificationPanel
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onMarkRead={async () => {
          await api.markNotificationsRead();
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        }}
        onDelete={async (id) => {
          await api.deleteNotification(id);
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
        onClearAll={async () => {
          await api.clearAllNotifications();
          setNotifications([]);
        }}
      />
      {AlertComponent}
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
      paddingTop: 14,
      paddingBottom: 10,
      gap: 10,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(129,128,126,0.15)",
    },
    clinicName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
      letterSpacing: -0.2,
    },
    bellBtn: {
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#F87171",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeText: { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },
    settingsBtn: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: { paddingHorizontal: 24, paddingTop: 20 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      marginBottom: 14,
    },
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      marginBottom: 14,
    },
    arrowBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 8 },
    card: {
      width: "47%",
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 18,
      gap: 4,
    },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    cardLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: c.text,
      marginTop: 8,
    },
    cardSub: { fontSize: 12, color: c.textMuted, fontWeight: "500" },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
    },
    txnDot: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    txnName: { fontSize: 14, fontWeight: "600", color: c.text },
    txnMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    txnQty: { fontSize: 18, fontWeight: "800" },
    emptyBox: { alignItems: "center", paddingVertical: 36, gap: 10 },
    emptyText: { fontSize: 14, color: c.textMuted },
    deliveryBanner: {
      backgroundColor: c.isDark
        ? "rgba(29,111,164,0.12)"
        : "rgba(29,111,164,0.08)",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "rgba(29,111,164,0.25)",
      padding: 16,
      marginBottom: 18,
      gap: 10,
    },
    deliveryBannerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    deliveryIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: "rgba(29,111,164,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    deliveryBannerTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1D6FA4",
    },
    deliveryBadge: {
      backgroundColor: "#1D6FA4",
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    deliveryBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
    deliveryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "rgba(29,111,164,0.12)",
      flexWrap: "wrap",
    },
    deliveryItemName: {
      fontSize: 13,
      fontWeight: "600",
      color: "#1D6FA4",
      flex: 1,
    },
    deliveryMeta: {
      fontSize: 11,
      color: c.textMuted,
      width: "100%",
      paddingLeft: 22,
    },
  });
}
