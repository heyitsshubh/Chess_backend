// ============================================================
// Register Screen — Material Design 3
// ============================================================
import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Text, Surface, Divider } from "react-native-paper";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthInput } from "@/components/ui/AuthInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/store/authStore";
import { MD_COLORS } from "@/theme";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; username?: string; password?: string }>({});
  const { register, isLoading, error, clearError } = useAuthStore();

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (username.length < 3 || username.length > 20) e.username = "Username must be 3-20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = "Letters, numbers and underscores only";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    try {
      await register(email, username, password);
      router.replace("/(auth)/login");
    } catch {
      // error is set in store
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.chessman}>♟</Text>
            <Text variant="displaySmall" style={styles.title}>
              Join the Game
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Create your chess account
            </Text>
          </View>

          {/* Card */}
          <Surface style={styles.card} elevation={2}>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Create Account
            </Text>

            {error ? (
              <Surface style={styles.errorBanner} elevation={0}>
                <Text style={styles.errorText}>{error}</Text>
              </Surface>
            ) : null}

            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={errors.email}
              left={<AuthInput.Icon icon="email-outline" />}
            />
            <AuthInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="grandmaster42"
              error={errors.username}
              left={<AuthInput.Icon icon="account-outline" />}
            />
            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="min 8 characters"
              isPassword
              error={errors.password}
              left={<AuthInput.Icon icon="lock-outline" />}
            />

            <GradientButton
              label="Create Account"
              onPress={handleRegister}
              isLoading={isLoading}
              icon="account-plus"
              style={styles.btn}
            />
          </Surface>

          {/* Footer */}
          <View style={styles.footer}>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.footerText}>
              Already have an account?
            </Text>
            <GradientButton
              label="Sign In"
              onPress={() => router.push("/(auth)/login")}
              mode="text"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MD_COLORS.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  hero: { alignItems: "center", marginBottom: 32 },
  chessman: { fontSize: 64, marginBottom: 12 },
  title: { color: MD_COLORS.primary, fontWeight: "800", textAlign: "center" },
  subtitle: { color: MD_COLORS.onSurfaceVariant, marginTop: 4, textAlign: "center" },
  card: { backgroundColor: MD_COLORS.surface, borderRadius: 24, padding: 24, marginBottom: 16 },
  cardTitle: { color: MD_COLORS.onSurface, fontWeight: "700", marginBottom: 20 },
  errorBanner: { backgroundColor: "#93000A", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: "#FFB4AB", fontSize: 13 },
  btn: { marginTop: 8 },
  footer: { alignItems: "center", gap: 4 },
  divider: { width: "60%", marginBottom: 16, backgroundColor: MD_COLORS.outline },
  footerText: { color: MD_COLORS.onSurfaceVariant },
});
