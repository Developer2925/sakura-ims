import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { navBack } from "@/lib/animationStore";
import { AppIcon, ICONS, ICON_SIZES } from "@/components/AppIcons";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { DatePickerField } from "@/components/DatePickerField";
import { useTheme } from "@/lib/theme";

const CONDITIONS = ["新品", "良好", "普通", "期限切れ"];
const COND_LABELS = {
  新品: { en: "New", ja: "新品" },
  良好: { en: "Good", ja: "良好" },
  普通: { en: "Fair", ja: "普通" },
  期限切れ: { en: "Expired", ja: "期限切れ" },
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function ConfirmDeliveryScreen() {
  const { t, lang } = useLang();
  const { requestId, itemName, quantity, unitPrice } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [price, setPrice] = useState(unitPrice ? String(unitPrice) : "");
  const [expiryDate, setExpiryDate] = useState("");
  const [restockDate, setRestockDate] = useState(todayISO());
  const [condition, setCondition] = useState("新品");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert(t("error"), t("priceRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await api.confirmDelivery({
        requestId: Number(requestId),
        price: parsedPrice,
        expiryDate: expiryDate || undefined,
        conditionStatus: condition,
        restockDate: restockDate || undefined,
      });
      Alert.alert(t("deliveryConfirmed"), t("deliveryConfirmedMsg"), [
        {
          text: t("done"),
          onPress: () => navBack('/(app)/dashboard'),
        },
      ]);
    } catch (err) {
      Alert.alert(t("error"), err.message);
    } finally {
      setSubmitting(false);
    }
  }

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("confirmDeliveryTitle")}</Text>
          <Text style={styles.subtitle}>{t("confirmDeliverySubtitle")}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Item summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <AppIcon name="item" size={16} color="#8EC8FF" />
            <Text style={styles.summaryItem} numberOfLines={1}>{itemName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <AppIcon name="batches" size={16} />
            <Text style={styles.summaryMeta}>
              {t("requestCountLabel")}: {quantity}
            </Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("unitPriceLabel")}</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Restock date */}
        <DatePickerField
          label={t("restockDateLabel")}
          value={restockDate}
          onChange={setRestockDate}
        />

        {/* Expiry date */}
        <DatePickerField
          label={t("expiryDateLabel")}
          value={expiryDate}
          onChange={setExpiryDate}
        />

        {/* Condition chips */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("conditionLabel2")}</Text>
          <View style={styles.chipRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, condition === c && styles.chipActive]}
                onPress={() => setCondition(c)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    condition === c && styles.chipTextActive,
                  ]}
                >
                  {lang === "ja" ? COND_LABELS[c].ja : COND_LABELS[c].en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#0F0F0F" />
          ) : (
            <AppIcon name="checkCircle" size={18} color="#0F0F0F" />
          )}
          <Text style={styles.confirmBtnText}>
            {submitting ? t("confirmingReceive") : t("confirmReceive")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
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
      marginTop: 2,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      letterSpacing: -0.3,
    },
    subtitle: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    summaryCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      gap: 8,
      marginBottom: 20,
    },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    summaryItem: { fontSize: 15, fontWeight: "700", color: c.text, flex: 1 },
    summaryMeta: { fontSize: 13, color: c.textMuted },
    fieldGroup: { marginBottom: 18 },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: c.textMuted,
      marginBottom: 8,
    },
    input: {
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: c.text,
      borderWidth: 1,
      borderColor: c.surface2,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.border,
      borderWidth: 1,
      borderColor: "transparent",
    },
    chipActive: {
      backgroundColor: "rgba(142,200,255,0.15)",
      borderColor: "#8EC8FF",
    },
    chipText: { fontSize: 13, fontWeight: "600", color: c.textMuted },
    chipTextActive: { color: "#8EC8FF" },
    footer: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      paddingTop: 12,
      backgroundColor: c.bg,
      borderTopWidth: 1,
      borderTopColor: c.surface,
    },
    confirmBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#8EC8FF",
      borderRadius: 16,
      paddingVertical: 16,
    },
    confirmBtnDisabled: { opacity: 0.6 },
    confirmBtnText: { fontSize: 15, fontWeight: "700", color: "#0F0F0F" },
  });
}
