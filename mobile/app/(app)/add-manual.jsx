import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useNavigation } from "expo-router";
import { navBack } from "@/lib/animationStore";
import { AppIcon } from "@/components/AppIcons";
import { useAlert } from "@/components/AlertModal";
import { DatePickerField } from "@/components/DatePickerField";
import { InputField } from "@/components/InputField";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { QuantityControl } from "@/components/QuantityControl";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

// DB values stay in Japanese for consistency; display labels come from i18n
const CATEGORY_VALUES = ["医薬品", "機器", "消耗品", "手術用品", "その他"];
const CATEGORY_KEYS = [
  "cat_medicine",
  "cat_equipment",
  "cat_consumables",
  "cat_surgical",
  "cat_other",
];
const CONDITION_VALUES = ["新品", "良好", "普通", "期限切れ"];
const CONDITION_KEYS = ["cond_new", "cond_good", "cond_fair", "cond_expired"];

export default function AddManualScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      navBack('/(app)/dashboard');
    });
    return unsub;
  }, [navigation]);

  const { user } = useAuth();
  const { t } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    category: "",
    customCategory: "",
    condition: "新品",
    price: "",
    expiryDate: "",
    quantity: 1,
  });
  const [errors, setErrors] = useState({});

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t("itemNameRequired");
    if (!form.category) e.category = t("selectCategoryError");
    if (form.category === "其他" && !form.customCategory.trim())
      e.customCategory = t("customCategoryRequired");
    if (!form.price || isNaN(parseFloat(form.price))) e.price = t("validPrice");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function doSave() {
    setSaving(true);
    const finalCategory =
      form.category === "その他" ? form.customCategory.trim() : form.category;
    try {
      await api.addItem({
        name: form.name.trim(),
        manufacturer: form.manufacturer.trim(),
        category: finalCategory,
        condition: form.condition,
        price: parseFloat(form.price),
        expiryDate: form.expiryDate.trim() || undefined,
        quantity: form.quantity,
      });
      showAlert(
        t("savedTitle"),
        `${form.name}${t("addedToInventory")}`,
        [{ text: t("done"), onPress: () => navBack('/(app)/dashboard') }],
        "success",
      );
    } catch (err) {
      showAlert(t("error"), err?.message ?? t("failedToSave"), undefined, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!validate() || !user) return;
    showAlert(
      t("confirmAddTitle"),
      t("confirmAddMsg"),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("confirm"), onPress: doSave },
      ],
      "confirm",
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navBack('/(app)/dashboard')}
          activeOpacity={0.8}
        >
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("addManualTitle")}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBadge}>
          <AppIcon name="info" size={16} />
          <Text style={styles.infoText}>{t("noBarcodeNote")}</Text>
        </View>

        <InputField
          label={t("itemNameLabel")}
          value={form.name}
          onChangeText={(v) => setField("name", v)}
          placeholder="e.g. Dental Gloves S"
          error={errors.name}
        />
        <InputField
          label={t("manufacturerOptLabel")}
          value={form.manufacturer}
          onChangeText={(v) => setField("manufacturer", v)}
          placeholder="e.g. ABC Pharma"
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("categoryChipLabel")}</Text>
          <View style={styles.chipRow}>
            {CATEGORY_VALUES.map((val, idx) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.chip,
                  form.category === val && styles.chipActive,
                ]}
                onPress={() => setField("category", val)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.category === val && styles.chipTextActive,
                  ]}
                >
                  {t(CATEGORY_KEYS[idx])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category ? (
            <Text style={styles.errText}>{errors.category}</Text>
          ) : null}
        </View>

        {form.category === "その他" && (
          <InputField
            label={t("customCategoryLabel")}
            value={form.customCategory}
            onChangeText={(v) => setField("customCategory", v)}
            placeholder="Enter custom category"
            error={errors.customCategory}
          />
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("conditionChipLabel")}</Text>
          <View style={styles.chipRow}>
            {CONDITION_VALUES.map((val, idx) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.chip,
                  form.condition === val && styles.chipCondActive,
                ]}
                onPress={() => setField("condition", val)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.condition === val && styles.chipTextCondActive,
                  ]}
                >
                  {t(CONDITION_KEYS[idx])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <InputField
          label={t("priceChipLabel")}
          value={form.price}
          onChangeText={(v) => setField("price", v)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.price}
        />
        <DatePickerField
          label={t("expiryChipLabel")}
          value={form.expiryDate}
          onChange={(v) => setField("expiryDate", v)}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("qtyLabel")}</Text>
          <QuantityControl
            value={form.quantity}
            onChange={(v) => setField("quantity", v)}
            min={1}
          />
        </View>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.ctaBtnText}>{t("saveItem")}</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>

      {saving && <LoadingOverlay message={t("savingMsg")} />}
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
    content: { paddingHorizontal: 20, paddingTop: 4 },
    infoBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
      borderWidth: 1,
      borderColor: "rgba(129,128,126,0.2)",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 20,
    },
    infoText: { fontSize: 13, color: c.textMuted, fontWeight: "500", flex: 1 },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textMuted,
      marginBottom: 10,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "rgba(129,128,126,0.1)",
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    chipActive: {
      backgroundColor: c.border2,
      borderColor: c.text,
    },
    chipCondActive: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontSize: 13, fontWeight: "600", color: c.textMuted },
    chipTextActive: { color: c.text },
    chipTextCondActive: { color: c.bg },
    errText: { fontSize: 12, color: c.textMuted, marginTop: 6 },
    ctaBtn: {
      backgroundColor: c.text,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: "center",
      marginTop: 8,
    },
    ctaBtnText: { color: c.bg, fontSize: 16, fontWeight: "700" },
  });
}
