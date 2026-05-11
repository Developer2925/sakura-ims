import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { navBack } from "@/lib/animationStore";
import { AppIcon } from "@/components/AppIcons";
import { InputField } from "@/components/InputField";
import { DatePickerField } from "@/components/DatePickerField";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useAlert } from "@/components/AlertModal";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

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

function formatExpiry(dateStr) {
  if (!dateStr) return "";
  return String(dateStr).split("T")[0];
}

export default function EditItemScreen() {
  const { itemId } = useLocalSearchParams();
  const { t } = useLang();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { showAlert, AlertComponent } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState(null);
  const [batches, setBatches] = useState([]);

  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    category: "",
    customCategory: "",
    condition: "新品",
    price: "",
    expiryDate: "",
  });
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [batchSaving, setBatchSaving] = useState({});

  useEffect(() => {
    loadItem();
  }, [itemId]);

  async function loadItem() {
    try {
      const { items } = await api.getInventory();
      const found = items.find((i) => String(i.id) === String(itemId));
      if (!found) {
        showAlert(t("error"), "Item not found", undefined, "error");
        return;
      }
      setItem(found);
      setBatches(found.batches || []);
      const isPreset = CATEGORY_VALUES.includes(found.category);
      const isCustom = !isPreset;
      setForm({
        name: found.name || "",
        manufacturer: found.manufacturer || "",
        category: isCustom ? "その他" : found.category || "",
        customCategory: isCustom ? found.category : "",
        condition: found.condition_status || "新品",
        price: found.price ? String(found.price) : "",
        expiryDate: formatExpiry(found.expiry_date),
      });
    } catch (err) {
      showAlert(
        t("error"),
        err?.message ?? "Failed to load item",
        undefined,
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function compressImage(uri) {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 600 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return compressed;
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      setImageUri(compressed.uri);
      setImageBase64(compressed.base64);
      setRemoveImage(false);
    }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      setImageUri(compressed.uri);
      setImageBase64(compressed.base64);
      setRemoveImage(false);
    }
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t("itemNameRequired");
    if (!form.category) e.category = t("selectCategoryError");
    if (form.category === "その他" && !form.customCategory.trim())
      e.customCategory = t("customCategoryRequired");
    if (!form.price || isNaN(parseFloat(form.price))) e.price = t("validPrice");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const finalCategory =
      form.category === "その他" ? form.customCategory.trim() : form.category;
    try {
      const payload = {
        name: form.name.trim(),
        manufacturer: form.manufacturer.trim(),
        category: finalCategory,
        condition: form.condition,
        price: parseFloat(form.price),
        expiryDate: form.expiryDate || undefined,
      };
      if (imageBase64) payload.imageData = imageBase64;
      else if (removeImage) payload.imageData = null;
      await api.updateItem(Number(itemId), payload);
      showAlert(
        t("savedTitle"),
        t("itemUpdated"),
        [{ text: t("done"), onPress: () => navBack("/(app)/inventory") }],
        "success",
      );
    } catch (err) {
      showAlert(
        t("error"),
        err?.message ?? t("failedToSave"),
        undefined,
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBatch(batch, batchForm) {
    setBatchSaving((s) => ({ ...s, [batch.id]: true }));
    try {
      const updated = await api.updateBatch(batch.id, {
        price: parseFloat(batchForm.price),
        expiryDate: batchForm.expiryDate || undefined,
        condition: batchForm.condition,
      });
      setBatches((prev) =>
        prev.map((b) => (b.id === batch.id ? updated.batch : b)),
      );
      showAlert(t("savedTitle"), t("batchUpdated"), undefined, "success");
    } catch (err) {
      showAlert(
        t("error"),
        err?.message ?? t("failedToSave"),
        undefined,
        "error",
      );
    } finally {
      setBatchSaving((s) => ({ ...s, [batch.id]: false }));
    }
  }

  const currentImageUri = imageUri
    ? imageUri
    : !removeImage && item?.image_data
      ? `data:image/jpeg;base64,${item.image_data}`
      : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navBack("/(app)/inventory")}
          activeOpacity={0.8}
        >
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("editItemTitle")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image */}
        <View style={styles.imageSection}>
          {currentImageUri ? (
            <View style={{ alignItems: "center", gap: 10 }}>
              <Image
                source={{ uri: currentImageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <AppIcon name="images" size={16} />
                  <Text style={styles.imagePickerBtnText}>
                    {t("changeImage")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageRemoveBtn}
                  onPress={() => {
                    setImageUri(null);
                    setImageBase64(null);
                    setRemoveImage(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.imageRemoveBtnText}>
                    {t("removeImage")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imagePickerRow}>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <AppIcon name="images" size={18} />
                <Text style={styles.imagePickerBtnText}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <AppIcon name="camera" size={18} />
                <Text style={styles.imagePickerBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Item fields */}
        <InputField
          label={t("itemNameLabel")}
          value={form.name}
          onChangeText={(v) => setField("name", v)}
          error={errors.name}
        />
        <InputField
          label={t("manufacturerOptLabel")}
          value={form.manufacturer}
          onChangeText={(v) => setField("manufacturer", v)}
        />

        <View style={styles.chipGroup}>
          <Text style={styles.chipGroupLabel}>{t("categoryChipLabel")}</Text>
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
            error={errors.customCategory}
          />
        )}

        <View style={styles.chipGroup}>
          <Text style={styles.chipGroupLabel}>{t("conditionChipLabel")}</Text>
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
          keyboardType="decimal-pad"
          error={errors.price}
        />
        <DatePickerField
          label={t("expiryOptionalLabel")}
          value={form.expiryDate}
          onChange={(v) => setField("expiryDate", v)}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{t("saveChanges")}</Text>
        </TouchableOpacity>

        {/* Batches */}
        {batches.length > 0 && (
          <>
            <Text style={styles.batchesHeader}>{t("editBatchesTitle")}</Text>
            {batches.map((batch) => (
              <BatchEditRow
                key={batch.id}
                batch={batch}
                saving={!!batchSaving[batch.id]}
                onSave={(batchForm) => handleSaveBatch(batch, batchForm)}
                colors={colors}
                styles={styles}
                t={t}
              />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {saving && <LoadingOverlay message={t("savingItem")} />}
      {AlertComponent}
    </SafeAreaView>
  );
}

function BatchEditRow({ batch, saving, onSave, colors, styles, t }) {
  const [form, setForm] = useState({
    price: String(batch.price),
    expiryDate: formatExpiry(batch.expiry_date),
    condition: batch.condition_status || "新品",
  });

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <View style={styles.batchCard}>
      <View style={styles.batchCardHeader}>
        <AppIcon name="batches" size={14} />
        <Text style={styles.batchCardTitle}>
          {t("batchLabel")} · {batch.quantity} pcs
        </Text>
      </View>
      <InputField
        label={t("priceChipLabel")}
        value={form.price}
        onChangeText={(v) => setField("price", v)}
        keyboardType="decimal-pad"
      />
      <DatePickerField
        label={t("expiryOptionalLabel")}
        value={form.expiryDate}
        onChange={(v) => setField("expiryDate", v)}
      />
      <View style={styles.chipGroup}>
        <Text style={styles.chipGroupLabel}>{t("conditionChipLabel")}</Text>
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
      <TouchableOpacity
        style={[styles.batchSaveBtn, saving && { opacity: 0.5 }]}
        onPress={() => onSave(form)}
        activeOpacity={0.85}
        disabled={saving}
      >
        <Text style={styles.batchSaveBtnText}>
          {saving ? t("saving") : t("saveBatch")}
        </Text>
      </TouchableOpacity>
    </View>
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
    imageSection: { marginBottom: 20 },
    imagePreview: {
      width: 120,
      height: 120,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    imagePickerRow: { flexDirection: "row", gap: 10 },
    imagePickerBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: "rgba(129,128,126,0.2)",
    },
    imagePickerBtnText: { fontSize: 14, fontWeight: "600", color: c.textMuted },
    imageRemoveBtn: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: "rgba(239,68,68,0.1)",
      justifyContent: "center",
    },
    imageRemoveBtnText: { fontSize: 13, fontWeight: "600", color: "#EF4444" },
    chipGroup: { marginBottom: 20 },
    chipGroupLabel: {
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
    chipActive: { backgroundColor: c.border2, borderColor: c.text },
    chipCondActive: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontSize: 13, fontWeight: "600", color: c.textMuted },
    chipTextActive: { color: c.text },
    chipTextCondActive: { color: c.bg },
    errText: { fontSize: 12, color: c.textMuted, marginTop: 6 },
    saveBtn: {
      backgroundColor: c.text,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 32,
      marginTop: 8,
    },
    saveBtnText: { color: c.bg, fontSize: 16, fontWeight: "700" },
    batchesHeader: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 12,
      marginLeft: 4,
    },
    batchCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    batchCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    batchCardTitle: { fontSize: 14, fontWeight: "700", color: c.text },
    batchSaveBtn: {
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: c.border,
      marginTop: 8,
    },
    batchSaveBtnText: { fontSize: 14, fontWeight: "700", color: c.text },
  });
}
