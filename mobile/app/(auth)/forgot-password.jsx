import React, { useRef, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { InputField } from "@/components/InputField";
import { AppLogo } from "@/components/AppLogo";
import { useAlert } from "@/components/AlertModal";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { API_URL } from "@/lib/config";
import { AppIcon } from "@/components/AppIcons";

const SCREEN_EMAIL    = "email";
const SCREEN_OTP      = "otp";
const SCREEN_PASSWORD = "password";

export default function ForgotPasswordScreen() {
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const { t, lang, toggle } = useLang();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [screen, setScreen] = useState(SCREEN_EMAIL);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const otpRefs = useRef([]);

  async function handleSendOTP() {
    if (!email.trim() || !email.includes("@")) {
      showAlert(t("invalidEmail"), t("enterValidEmail"), undefined, "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setScreen(SCREEN_OTP);
    } catch (err) {
      showAlert(t("error"), err?.message ?? "Please try again", undefined, "error");
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
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleVerifyOTP() {
    if (otp.join("").length < 6) {
      showAlert(t("invalidOTP"), t("enterSixDigit"), undefined, "error");
      return;
    }
    setScreen(SCREEN_PASSWORD);
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) {
      showAlert(t("passwordTooShort"), t("passwordMin6"), undefined, "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert(t("passwordMismatch"), t("passwordsDontMatch"), undefined, "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.join(""), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      showAlert(
        t("passwordUpdated"),
        t("passwordUpdatedMsg"),
        [{ text: t("signIn"), onPress: () => router.replace("/(auth)/login") }],
        "success"
      );
    } catch (err) {
      showAlert(t("resetFailed"), err?.message ?? "Please try again", undefined, "error");
      // If OTP invalid, go back to OTP screen
      if (err?.message?.toLowerCase().includes("invalid") || err?.message?.toLowerCase().includes("expired")) {
        setScreen(SCREEN_OTP);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <AppIcon name="back" size={16} />
              <Text style={styles.backBtnText}>Back</Text>
            </View>
          </TouchableOpacity>

          {/* ── Email screen ─────────────────────────────────────────────── */}
          {screen === SCREEN_EMAIL && (
            <>
              <View style={styles.logoWrap}>
                <AppLogo size="large" />
                <Text style={styles.headline}>{t("forgotPasswordTitle")}</Text>
                <Text style={styles.sub}>{t("forgotPasswordSub")}</Text>
              </View>

              <InputField
                label={t("email")}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@clinic.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendOTP}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? t("sending") : t("sendResetCode")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── OTP screen ───────────────────────────────────────────────── */}
          {screen === SCREEN_OTP && (
            <>
              <View style={styles.logoWrap}>
                <Text style={styles.headline}>{t("checkEmail")}</Text>
                <Text style={styles.sub}>
                  Code sent to{"\n"}<Text style={styles.emailHighlight}>{email}</Text>
                </Text>
              </View>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => (otpRefs.current[i] = r)}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.btn}
                onPress={handleVerifyOTP}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{t("continueBtn")}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={handleSendOTP} disabled={loading} activeOpacity={0.7}>
                <Text style={styles.resendText}>{loading ? t("sending") : t("resendCode")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── New password screen ──────────────────────────────────────── */}
          {screen === SCREEN_PASSWORD && (
            <>
              <View style={styles.logoWrap}>
                <Text style={styles.headline}>{t("newPasswordTitle")}</Text>
                <Text style={styles.sub}>{t("newPasswordSub")}</Text>
              </View>

              <InputField
                label={t("profileNewPassword")}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                secureTextEntry
              />
              <InputField
                label={t("confirmPassword")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? t("updating") : t("resetPassword")}</Text>
              </TouchableOpacity>
            </>
          )}
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

    backBtn: { marginBottom: 24 },
    backBtnText: { fontSize: 14, color: c.textMuted, fontWeight: "600" },

    logoWrap: { alignItems: "center", marginBottom: 32, gap: 6 },
    headline: {
      fontSize: 26, fontWeight: "800", color: c.text,
      letterSpacing: -0.5, marginTop: 8, textAlign: "center",
    },
    sub: { fontSize: 15, color: c.textMuted, fontWeight: "500", textAlign: "center" },
    emailHighlight: { color: c.text, fontWeight: "700" },

    btn: {
      backgroundColor: c.text, borderRadius: 20,
      paddingVertical: 18, alignItems: "center", marginTop: 8,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: c.bg, fontSize: 16, fontWeight: "700" },

    otpRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 32 },
    otpBox: {
      width: 46, height: 56, borderRadius: 14,
      backgroundColor: c.surface, borderWidth: 1.5,
      borderColor: c.border ?? "rgba(129,128,126,0.2)",
      textAlign: "center", fontSize: 22, fontWeight: "800", color: c.text,
    },
    otpBoxFilled: { borderColor: c.text },

    resendBtn: { alignItems: "center", marginTop: 16 },
    resendText: { fontSize: 14, color: c.textMuted, fontWeight: "600" },
  });
}
