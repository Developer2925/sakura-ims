import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { navBack } from "@/lib/animationStore";
import { AppIcon } from "@/components/AppIcons";
import { InputField } from "@/components/InputField";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/components/AlertModal";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";

const SECTION_NONE     = null;
const SECTION_EMAIL    = "email";
const SECTION_PASSWORD = "password";
const SECTION_EMAIL_OTP = "email_otp";


export default function ProfileScreen() {
  const { user, requestEmailChange, verifyEmailChange, updatePassword, deleteAccount } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const { t } = useLang();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const POSITIONS = { clinic: t("profileClinicStaff"), office_staff: t("profileOfficeStaff") };

  const [section, setSection] = useState(SECTION_NONE);
  const [loading, setLoading] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  function resetState() {
    setSection(SECTION_NONE);
    setNewEmail("");
    setOtp(["", "", "", "", "", ""]);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  }

  async function handleRequestEmailChange() {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      showAlert("Invalid Email", "Enter a valid email address", undefined, "error");
      return;
    }
    setLoading(true);
    try {
      await requestEmailChange(newEmail.trim());
      setSection(SECTION_EMAIL_OTP);
    } catch (err) {
      showAlert("Error", err?.message ?? "Please try again", undefined, "error");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value, index) {
    const next = [...otp];
    next[index] = value.replace(/\D/g, "").slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyPress(key, index) {
    if (key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  async function handleVerifyEmailChange() {
    const code = otp.join("");
    if (code.length < 6) {
      showAlert("Invalid Code", "Enter the 6-digit code", undefined, "error");
      return;
    }
    setLoading(true);
    try {
      await verifyEmailChange(code);
      showAlert("Email Updated", "Your email has been changed successfully", [{ text: "OK", onPress: resetState }], "success");
    } catch (err) {
      showAlert("Error", err?.message ?? "Please try again", undefined, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword() {
    if (!currentPw) { showAlert("Error", "Enter your current password", undefined, "error"); return; }
    if (!newPw || newPw.length < 6) { showAlert("Error", "New password must be at least 6 characters", undefined, "error"); return; }
    if (newPw !== confirmPw) { showAlert("Error", "Passwords don't match", undefined, "error"); return; }
    setLoading(true);
    try {
      await updatePassword(currentPw, newPw);
      showAlert("Password Updated", "Your password has been changed", [{ text: "OK", onPress: resetState }], "success");
    } catch (err) {
      showAlert("Error", err?.message ?? "Please try again", undefined, "error");
    } finally {
      setLoading(false);
    }
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.organizationName || "—";
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navBack("/(app)/dashboard")} activeOpacity={0.8}>
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("profileTitle")}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Avatar + name */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.position}>{POSITIONS[user?.position] ?? "—"}</Text>
        </View>

        {/* Info rows */}
        <View style={styles.infoCard}>
          <InfoRow label="Email" value={user?.email ?? "—"} colors={colors} />
          <InfoRow label={t("profilePosition")} value={POSITIONS[user?.position] ?? "—"} colors={colors} last />
        </View>

        {/* Update Password */}
        {user?.hasPassword !== false && (
          <>
            <Text style={styles.sectionLabel}>{t("profileChangePassword")}</Text>
            <View style={styles.card}>
              {section !== SECTION_PASSWORD ? (
                <TouchableOpacity style={styles.editRow} onPress={() => setSection(SECTION_PASSWORD)} activeOpacity={0.8}>
                  <Text style={styles.editRowText}>{t("profileChangePassword")}</Text>
                  <AppIcon name="forward" size={16} />
                </TouchableOpacity>
              ) : (
                <View style={styles.editForm}>
                  <InputField label={t("profileCurrentPassword")} value={currentPw} onChangeText={setCurrentPw} placeholder="••••••••" secureTextEntry />
                  <InputField label={t("profileNewPassword")} value={newPw} onChangeText={setNewPw} placeholder="At least 6 characters" secureTextEntry />
                  <InputField label={t("profileNewPassword")} value={confirmPw} onChangeText={setConfirmPw} placeholder="Repeat password" secureTextEntry />
                  <View style={styles.formBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={resetState} activeOpacity={0.7}>
                      <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveBtn, loading && styles.btnDisabled]} onPress={handleUpdatePassword} disabled={loading} activeOpacity={0.85}>
                      <Text style={styles.saveBtnText}>{t("profileUpdate")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Delete Account */}
        <Text style={[styles.sectionLabel, { color: "#EF4444" }]}>{t("dangerZone")}</Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          activeOpacity={0.8}
          onPress={() =>
            showAlert(
              t("deleteAccountTitle"),
              t("deleteAccountMsg"),
              [
                { text: t("cancel"), style: "cancel" },
                {
                  text: t("deleteAccountConfirm"),
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      router.replace("/(auth)/login");
                    } catch (err) {
                      showAlert(t("error"), err?.message ?? "Failed to delete account", undefined, "error");
                    }
                  },
                },
              ],
              "error"
            )
          }
        >
          <Text style={styles.deleteBtnText}>{t("deleteAccount")}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      {AlertComponent}
    </SafeAreaView>
  );
}

function InfoRow({ label, value, colors, last }) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 14, paddingHorizontal: 16,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.border ?? "rgba(129,128,126,0.12)",
    }}>
      <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14, backgroundColor: c.bg },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "800", color: c.text, letterSpacing: -0.3 },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    avatarWrap: { alignItems: "center", marginBottom: 28, gap: 6 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.surface, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    avatarText: { fontSize: 28, fontWeight: "800", color: c.text },
    name: { fontSize: 20, fontWeight: "800", color: c.text },
    position: { fontSize: 14, color: c.textMuted, fontWeight: "500" },
    infoCard: { backgroundColor: c.surface, borderRadius: 16, marginBottom: 24, overflow: "hidden" },
    sectionLabel: { fontSize: 12, fontWeight: "700", color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: c.surface, borderRadius: 16, marginBottom: 24, overflow: "hidden" },
    editRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 16 },
    editRowText: { fontSize: 15, fontWeight: "600", color: c.text },
    editForm: { padding: 16, gap: 4 },
    otpHint: { fontSize: 13, color: c.textMuted, marginBottom: 16, textAlign: "center" },
    otpRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 },
    otpBox: { width: 42, height: 52, borderRadius: 12, backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.border ?? "rgba(129,128,126,0.2)", textAlign: "center", fontSize: 20, fontWeight: "800", color: c.text },
    otpBoxFilled: { borderColor: c.text },
    formBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "rgba(129,128,126,0.1)", alignItems: "center" },
    cancelBtnText: { fontSize: 14, fontWeight: "700", color: c.textMuted },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: c.text, alignItems: "center" },
    saveBtnText: { fontSize: 14, fontWeight: "700", color: c.bg },
    btnDisabled: { opacity: 0.5 },
    deleteBtn: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 12, borderWidth: 1.5, borderColor: "rgba(239,68,68,0.2)" },
    deleteBtnText: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
  });
}
