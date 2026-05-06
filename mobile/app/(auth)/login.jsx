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

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!username.trim()) e.username = t("usernameRequired");
    if (!password) e.password = t("passwordRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(username.trim(), password);
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
            label={t("username")}
            value={username}
            onChangeText={setUsername}
            placeholder={t("usernamePlaceholder")}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.username}
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

          <Text style={styles.adminHint}>{t("adminHint")}</Text>
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
    btnDisabled: { opacity: 0.6 },
    btnText: { color: c.bg, fontSize: 16, fontWeight: "700" },

    adminHint: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: "center",
      marginTop: 20,
    },
  });
}
