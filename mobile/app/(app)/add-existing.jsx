import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { navBack } from "@/lib/animationStore";
import { AppIcon } from "@/components/AppIcons";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function AddExistingScreen() {
  const { barcode } = useLocalSearchParams();
  const { t, tCondition } = useLang();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barcode) return;
    api
      .checkBarcode(barcode)
      .then(({ items: found }) => setItems(found))
      .finally(() => setLoading(false));
  }, [barcode]);

  const baseItem = items[0];

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  const DETAIL_ROWS = (item) => [
    [t("categoryLabel"), item.category],
    [t("conditionLabel"), tCondition(item.condition_status)],
    [t("priceLabel"), `¥${Number(item.price).toFixed(2)}`],
    [t("totalPriceLabel"), `¥${Number(item.total_price).toFixed(2)}`],
    [t("expiryLabel"), item.expiry_date ? item.expiry_date.slice(0, 10) : "—"],
    [t("manufacturerLabel"), item.manufacturer || "—"],
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navBack('/(app)/dashboard')}
          activeOpacity={0.8}
        >
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {baseItem?.name ?? t("itemDetail")}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.barcodeBadge}>
          <AppIcon name="barcode" size={16} />
          <Text style={styles.barcodeText} numberOfLines={1}>
            {barcode}
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppIcon name="item" size={48} />
            <Text style={styles.emptyText}>{t("itemNotFoundEmpty")}</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View
                  style={[
                    styles.qtyBadge,
                    item.quantity <= 10 && styles.qtyBadgeLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.qtyNum,
                      item.quantity <= 10 && { color: "#E8909D" },
                    ]}
                  >
                    {item.quantity}
                  </Text>
                  <Text style={styles.qtyLabel}>{t("inStock")}</Text>
                </View>
              </View>

              {DETAIL_ROWS(item).map(([label, value]) => (
                <View key={label} style={styles.row}>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={styles.rowValue}>{value}</Text>
                </View>
              ))}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/restock-request",
                      params: { itemId: item.id, itemName: item.name },
                    })
                  }
                  activeOpacity={0.85}
                >
                  <AppIcon name="arrow-up-circle-outline" size={16} />
                  <Text style={styles.actionBtnSecondaryText}>{t("restockRequest")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/add-stock",
                      params: {
                        itemId: item.id,
                        itemName: item.name,
                        currentQty: item.quantity,
                        price: item.price,
                        category: item.category,
                        conditionStatus: item.condition_status,
                      },
                    })
                  }
                  activeOpacity={0.85}
                >
                  <AppIcon name="addCircleOutline" size={16} color={colors.bg} />
                  <Text style={styles.actionBtnPrimaryText}>{t("addStock")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    title: { fontSize: 20, fontWeight: "800", color: c.text, flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 4 },
    barcodeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 20,
    },
    barcodeText: {
      fontFamily: "monospace",
      fontSize: 13,
      color: c.textMuted,
      flex: 1,
    },
    emptyBox: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 14, color: c.textMuted },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      gap: 10,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardName: { fontSize: 16, fontWeight: "800", color: c.text, flex: 1 },
    qtyBadge: {
      alignItems: "center",
      backgroundColor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      borderRadius: 10,
      padding: 8,
      minWidth: 52,
    },
    qtyBadgeLow: { backgroundColor: "rgba(232,144,157,0.12)" },
    qtyNum: {
      fontSize: 20,
      fontWeight: "800",
      color: c.text,
      textAlign: "center",
    },
    qtyLabel: { fontSize: 10, color: c.textMuted, textAlign: "center" },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowLabel: { fontSize: 13, color: c.textMuted, fontWeight: "500" },
    rowValue: { fontSize: 13, color: c.text, fontWeight: "700" },
    actionRow: {
      flexDirection: "row", gap: 10, marginTop: 6,
    },
    actionBtnPrimary: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, backgroundColor: c.text, borderRadius: 14, paddingVertical: 13,
    },
    actionBtnPrimaryText: { color: c.bg, fontSize: 14, fontWeight: "700" },
    actionBtnSecondary: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, backgroundColor: c.border, borderRadius: 14, paddingVertical: 13,
    },
    actionBtnSecondaryText: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
  });
}
