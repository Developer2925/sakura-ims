import React, { useRef, useState } from "react";
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from "react-native";
import { router } from "expo-router";
import { InputField } from "@/components/InputField";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/components/AlertModal";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { setPendingAnimation } from "@/lib/animationStore";
import { AppIcon } from "@/components/AppIcons";

const SCREEN_FORM = "form";
const SCREEN_OTP  = "otp";


export default function RegisterScreen() {
  const { requestOTP, verifyOTP } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const { t, lang, toggle } = useLang();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const POSITIONS = [
    { value: "clinic",       label: t("clinicStaff"), icon: "business" },
    { value: "office_staff", label: t("officeStaff"), icon: "person" },
  ];

  const [screen, setScreen] = useState(SCREEN_FORM);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "", position: "", organizationName: "",
  });
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  function setField(k, v) {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  }

  function validateForm() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = t("enterValidEmail");
    if (!form.password || form.password.length < 6) e.password = t("passwordMin6");
    if (form.password !== form.confirmPassword) e.confirmPassword = t("passwordsDontMatch");
    if (!form.position) e.position = t("selectPosition");
    if (!form.organizationName.trim()) e.organizationName = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSendOTP() {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await requestOTP(form.firstName, form.lastName, form.email, form.password, form.confirmPassword, form.position, form.organizationName);
      setScreen(SCREEN_OTP);
    } catch (err) {
      showAlert(t("registrationFailed"), err?.message ?? "Please try again", undefined, "error");
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

  async function handleVerifyOTP() {
    const code = otp.join("");
    if (code.length < 6) {
      showAlert(t("invalidOTP"), t("enterSixDigit"), undefined, "error");
      return;
    }
    setLoading(true);
    try {
      await verifyOTP(form.email, code);
      setPendingAnimation("fade_from_bottom");
      router.replace("/(app)/dashboard");
    } catch (err) {
      showAlert(t("verificationFailed"), err?.message ?? t("invalidOrExpired"), undefined, "error");
    } finally {
      setLoading(false);
    }
  }

  // ── FORM ─────────────────────────────────────────────────────────────────────
  if (screen === SCREEN_FORM) {
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.7}
          style={{ position: "absolute", top: 48, right: 28, zIndex: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surface }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <AppIcon name="language" size={13} color={colors.textMuted} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted }}>{lang === "ja" ? "EN" : "日本語"}</Text>
          </View>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            <View style={styles.logoWrap}>
              <AppLogo size="large" />
              <Text style={styles.headline}>{t("registerHeadline")}</Text>
              <Text style={styles.sub}>{t("registerSub")}</Text>
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <InputField label={t("firstName")} value={form.firstName} onChangeText={v => setField("firstName", v)} placeholder="John" autoCapitalize="words" error={errors.firstName} />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label={t("lastName")} value={form.lastName} onChangeText={v => setField("lastName", v)} placeholder="Doe" autoCapitalize="words" error={errors.lastName} />
              </View>
            </View>

            <InputField label={t("email")} value={form.email} onChangeText={v => setField("email", v)} placeholder="you@clinic.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} />
            <InputField label={t("password")} value={form.password} onChangeText={v => setField("password", v)} placeholder="At least 6 characters" secureTextEntry error={errors.password} />
            <InputField label={t("confirmPassword")} value={form.confirmPassword} onChangeText={v => setField("confirmPassword", v)} placeholder="Repeat password" secureTextEntry error={errors.confirmPassword} />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("position")}</Text>
              <View style={styles.chipRow}>
                {POSITIONS.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, form.position === p.value && styles.chipActive]}
                    onPress={() => setField("position", p.value)}
                    activeOpacity={0.75}
                  >
                    <AppIcon name={p.icon} size={15} color={form.position === p.value ? colors.bg : colors.textMuted} />
                    <Text style={[styles.chipText, form.position === p.value && styles.chipTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.position ? <Text style={styles.errText}>{errors.position}</Text> : null}
            </View>

            <InputField
              label={form.position === "office_staff" ? t("officeNameLabel") : t("clinicNameLabel")}
              value={form.organizationName}
              onChangeText={v => setField("organizationName", v)}
              placeholder={form.position === "office_staff" ? t("officeNamePlaceholder") : t("clinicNamePlaceholder")}
              autoCapitalize="words"
              error={errors.organizationName}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSendOTP}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.btnText}>{loading ? t("sendingCode") : t("sendCode")}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("alreadyHaveAccount")} </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}>
                <Text style={styles.footerLink}>{t("signIn")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {AlertComponent}
      </KeyboardAvoidingView>
    );
  }

  // ── OTP ──────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={{ position: "absolute", top: 48, right: 28, zIndex: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surface }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <AppIcon name="language" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted }}>{lang === "ja" ? "EN" : "日本語"}</Text>
        </View>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen(SCREEN_FORM)} activeOpacity={0.7}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <AppIcon name="back" size={16} />
              <Text style={styles.backBtnText}>Back</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <Text style={styles.headline}>{t("verifyEmail")}</Text>
            <Text style={styles.sub}>{t("codeSentTo")}{"\n"}<Text style={styles.emailHighlight}>{form.email}</Text></Text>
          </View>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={r => (otpRefs.current[i] = r)}
                style={[styles.otpBox, digit && styles.otpBoxFilled]}
                value={digit}
                onChangeText={v => handleOtpChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleVerifyOTP} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.btnText}>{loading ? t("verifying") : t("verifyCreate")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={handleSendOTP} disabled={loading} activeOpacity={0.7}>
            <Text style={styles.resendText}>{loading ? t("sending") : t("resendCode")}</Text>
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
    inner: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 },
    backBtn: { marginBottom: 20 },
    backBtnText: { fontSize: 14, color: c.textMuted, fontWeight: "600" },
    logoWrap: { alignItems: "center", marginBottom: 28, gap: 6 },
    headline: { fontSize: 26, fontWeight: "800", color: c.text, letterSpacing: -0.5, marginTop: 8, textAlign: "center" },
    sub: { fontSize: 15, color: c.textMuted, fontWeight: "500", textAlign: "center" },
    emailHighlight: { color: c.text, fontWeight: "700" },
    row2: { flexDirection: "row", gap: 12 },
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
    otpRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 32 },
    otpBox: { width: 46, height: 56, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border ?? "rgba(129,128,126,0.2)", textAlign: "center", fontSize: 22, fontWeight: "800", color: c.text },
    otpBoxFilled: { borderColor: c.text },
    resendBtn: { alignItems: "center", marginTop: 16 },
    resendText: { fontSize: 14, color: c.textMuted, fontWeight: "600" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
    footerText: { fontSize: 14, color: c.textMuted },
    footerLink: { fontSize: 14, color: c.text, fontWeight: "700" },
  });
}
