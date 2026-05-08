import React, { useState } from "react";
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { InputField } from "@/components/InputField";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/components/AlertModal";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { AppIcon } from "@/components/AppIcons";
import { setPendingAnimation } from "@/lib/animationStore";

export default function GoogleOnboardingScreen() {
  const { email, firstName, lastName, googleId } = useLocalSearchParams();
  const { googleComplete } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const { t } = useLang();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const POSITIONS = [
    { value: "clinic",       label: t("clinicStaff"), icon: "business" },
    { value: "office_staff", label: t("officeStaff"), icon: "person" },
  ];

  const [position, setPosition] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!position) e.position = t("selectPosition");
    if (!organizationName.trim()) e.organizationName = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleComplete() {
    if (!validate()) return;
    setLoading(true);
    try {
      await googleComplete({ email, firstName, lastName, position, organizationName, googleId });
      setPendingAnimation("fade_from_bottom");
      router.replace("/(app)/dashboard");
    } catch (err) {
      showAlert(t("error"), err?.message ?? "Please try again", undefined, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={styles.logoWrap}>
            <AppLogo size="large" />
            <Text style={styles.headline}>One last step</Text>
            <Text style={styles.sub}>Tell us about your role</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "?"}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>{[firstName, lastName].filter(Boolean).join(" ")}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("position")}</Text>
            <View style={styles.chipRow}>
              {POSITIONS.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, position === p.value && styles.chipActive]}
                  onPress={() => { setPosition(p.value); setErrors(e => ({ ...e, position: "" })); }}
                  activeOpacity={0.75}
                >
                  <AppIcon name={p.icon} size={15} color={position === p.value ? colors.bg : colors.textMuted} />
                  <Text style={[styles.chipText, position === p.value && styles.chipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.position ? <Text style={styles.errText}>{errors.position}</Text> : null}
          </View>

          <InputField
            label={position === "office_staff" ? t("officeNameLabel") : t("clinicNameLabel")}
            value={organizationName}
            onChangeText={v => { setOrganizationName(v); setErrors(e => ({ ...e, organizationName: "" })); }}
            placeholder={position === "office_staff" ? t("officeNamePlaceholder") : t("clinicNamePlaceholder")}
            autoCapitalize="words"
            error={errors.organizationName}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleComplete}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "Setting up..." : "Get Started"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {AlertComponent}
    </KeyboardAvoidingView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    inner: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
    logoWrap: { alignItems: "center", marginBottom: 28, gap: 6 },
    headline: { fontSize: 26, fontWeight: "800", color: c.text, letterSpacing: -0.5, marginTop: 8, textAlign: "center" },
    sub: { fontSize: 15, color: c.textMuted, fontWeight: "500", textAlign: "center" },
    profileCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 28 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 18, fontWeight: "800", color: c.text },
    profileName: { fontSize: 15, fontWeight: "700", color: c.text },
    profileEmail: { fontSize: 13, color: c.textMuted, fontWeight: "500", marginTop: 2 },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 13, fontWeight: "700", color: c.textMuted, marginBottom: 10 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(129,128,126,0.1)", borderWidth: 1.5, borderColor: "transparent" },
    chipActive: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontSize: 14, fontWeight: "600", color: c.textMuted },
    chipTextActive: { color: c.bg },
    errText: { fontSize: 12, color: "#EF4444", marginTop: 6 },
    btn: { backgroundColor: c.text, borderRadius: 20, paddingVertical: 18, alignItems: "center", marginTop: 8 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: c.bg, fontSize: 16, fontWeight: "700" },
  });
}
