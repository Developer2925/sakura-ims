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
import { Link, router } from "expo-router";
import { InputField } from "@/components/InputField";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/components/AlertModal";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!clinicName.trim()) e.clinicName = "クリニック名は必須です";
    if (!email.trim()) e.email = "メールアドレスは必須です";
    if (!password || password.length < 6) e.password = "6文字以上必要です";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(clinicName.trim(), email.trim(), password);
      router.replace("/(app)/dashboard");
    } catch (err) {
      showAlert(
        "登録失敗",
        err?.message ?? "エラーが発生しました",
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <AppLogo size="large" />
            <Text style={styles.headline}>クリニックを登録</Text>
            <Text style={styles.sub}>クリニックアカウントを作成</Text>
          </View>

          <View style={{ height: 28 }} />

          <InputField
            label="クリニック名"
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="マイクリニック"
            autoCapitalize="words"
            error={errors.clinicName}
          />
          <InputField
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            placeholder="admin@clinic.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <InputField
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            placeholder="6文字以上"
            secureTextEntry
            error={errors.password}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "作成中…" : "アカウントを作成"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              すでにアカウントをお持ちの方は{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>サインイン</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
      {AlertComponent}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0F0F0F" },
  inner: { paddingHorizontal: 28, paddingTop: 48 },

  logoWrap: { alignItems: "center", marginBottom: 24, gap: 6 },

  headline: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  sub: { fontSize: 15, color: "#81807E", fontWeight: "500" },

  btn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#0F0F0F", fontSize: 16, fontWeight: "700" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: "#81807E" },
  footerLink: { fontSize: 14, color: "#FFFFFF", fontWeight: "700" },
});
