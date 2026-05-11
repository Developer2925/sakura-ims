import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { setPendingAnimation } from "@/lib/animationStore";
import { InputField } from "@/components/InputField";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/components/AlertModal";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { AppIcon } from "@/components/AppIcons";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

export default function LoginScreen() {
  const { login, googleLogin } = useAuth();
  const { t, lang, toggle } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!email.trim() || !email.includes("@")) e.email = "Valid email required";
    if (!password) e.password = "Password required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error("No ID token received");
      const result = await googleLogin(idToken);
      if (result?.newUser) {
        try {
          await GoogleSignin.signOut();
        } catch (_) {}
        router.push({
          pathname: "/(auth)/google-onboarding",
          params: {
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            googleId: result.googleId,
          },
        });
        return;
      }
      setPendingAnimation("fade_from_bottom");
      router.replace("/(app)/dashboard");
    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return;
      showAlert(
        t("loginFailed"),
        err?.message ?? "Google sign-in failed",
        undefined,
        "error",
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      setPendingAnimation("fade_from_bottom");
      router.replace("/(app)/dashboard");
    } catch (err) {
      showAlert(
        t("loginFailed"),
        err?.message ?? t("invalidCredentials"),
        undefined,
        "error",
      );
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
        style={{
          position: "absolute",
          top: 48,
          right: 28,
          zIndex: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <AppIcon name="language" size={13} color={colors.textMuted} />
          <Text
            style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted }}
          >
            {lang === "ja" ? "EN" : "日本語"}
          </Text>
        </View>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.logoWrap}>
            <AppLogo size="large" />
            <Text style={styles.headline}>{t("loginWelcome")}</Text>
            <Text style={styles.sub}>{t("loginSubtitle")}</Text>
          </View>

          <InputField
            label={t("email")}
            value={email}
            onChangeText={setEmail}
            placeholder="you@clinic.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <InputField
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            placeholder={t("passwordPlaceholder")}
            secureTextEntry
            error={errors.password}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? t("loggingIn") : t("login")}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
            onPress={handleGoogleLogin}
            activeOpacity={0.85}
            disabled={googleLoading}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleBtnText}>
              {googleLoading ? t("googleSigningIn") : t("continueWithGoogle")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => router.push("/(auth)/forgot-password")}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotLinkText}>{t("forgotPassword")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLinkText}>
              {t("noAccount")}{" "}
              <Text style={styles.registerLinkBold}>{t("createAccount")}</Text>
            </Text>
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
    inner: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 60,
      paddingBottom: 40,
      justifyContent: "center",
    },
    logoWrap: { marginBottom: 36, alignItems: "center", gap: 6 },
    headline: {
      fontSize: 26,
      fontWeight: "800",
      color: c.text,
      letterSpacing: -0.5,
      marginTop: 8,
    },
    sub: { fontSize: 15, color: c.textMuted, fontWeight: "500" },
    btn: {
      backgroundColor: c.text,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: "center",
      marginTop: 8,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: c.bg, fontSize: 16, fontWeight: "700" },
    forgotLink: { alignItems: "center", marginTop: 14 },
    forgotLinkText: { fontSize: 14, color: c.textMuted, fontWeight: "600" },
    registerLink: { alignItems: "center", marginTop: 10 },
    registerLinkText: { fontSize: 14, color: c.textMuted },
    registerLinkBold: { color: c.text, fontWeight: "700" },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border ?? "rgba(129,128,126,0.2)",
    },
    dividerText: { fontSize: 13, color: c.textMuted, fontWeight: "600" },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 20,
      paddingVertical: 16,
      borderWidth: 1.5,
      borderColor: c.border ?? "rgba(129,128,126,0.25)",
      backgroundColor: c.surface,
    },
    googleG: { fontSize: 16, fontWeight: "800", color: "#4285F4" },
    googleBtnText: { fontSize: 15, fontWeight: "700", color: c.text },
  });
}
