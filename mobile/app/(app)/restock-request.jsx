import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { navBack } from "@/lib/animationStore";
import { AppIcon, ICONS, ICON_SIZES } from "@/components/AppIcons";
import { useAlert } from "@/components/AlertModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { QuantityControl } from "@/components/QuantityControl";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function RestockRequestScreen() {
  const { itemId, itemName } = useLocalSearchParams();
  const { t } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function doSubmit() {
    if (!itemId) return;
    setSubmitting(true);
    try {
      await api.createRestockRequest({
        itemId: Number(itemId),
        requestedQuantity: quantity,
        notes: notes.trim() || undefined,
      });
      showAlert(
        t("requestSentTitle"),
        `${itemName}\n${t("adminWillReview")}`,
        [
          {
            text: t("done"),
            onPress: () => navBack('/(app)/dashboard'),
          },
        ],
        "success",
      );
    } catch (err) {
      showAlert(
        t("error"),
        err?.message ?? t("failedToSendRequest"),
        undefined,
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit() {
    if (!itemId) return;
    showAlert(
      t("confirmRestockTitle"),
      t("confirmRestockMsg"),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("confirm"), onPress: doSubmit },
      ],
      "confirm",
    );
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
        <Text style={styles.title}>{t("restockRequestTitle")}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemBadge}>
          <AppIcon name="item" size={18} />
          <Text style={styles.itemName} numberOfLines={2}>
            {itemName}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("requestQty")}</Text>
          <QuantityControl value={quantity} onChange={setQuantity} min={1} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("optionalNotes")}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder={t("notesPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.infoBox}>
          <AppIcon
            name="info"
            size={16}
          />
          <Text style={styles.infoText}>{t("restockInfoText")}</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <AppIcon name="send" size={18} color={colors.bg} />
          <Text style={styles.submitBtnText}>{t("sendRequest")}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {submitting && <LoadingOverlay message={t("submitting")} />}
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
    content: { paddingHorizontal: 20, paddingTop: 8 },
    itemBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 24,
    },
    itemName: { fontSize: 16, fontWeight: "700", color: c.text, flex: 1 },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textMuted,
      marginBottom: 12,
    },
    notesInput: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 14,
      color: c.text,
      minHeight: 100,
      borderWidth: 1.5,
      borderColor: "rgba(129,128,126,0.25)",
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(129,128,126,0.2)",
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 24,
    },
    infoText: { fontSize: 13, color: c.textMuted, flex: 1, lineHeight: 18 },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.text,
      borderRadius: 20,
      paddingVertical: 18,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: c.bg, fontSize: 16, fontWeight: "700" },
  });
}
