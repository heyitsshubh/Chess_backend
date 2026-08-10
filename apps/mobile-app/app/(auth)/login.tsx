// ============================================================
// Login Screen
//
// Premium dark glassmorphic login UI with form validation.
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthInput } from '@/components/ui/AuthInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoading, error, clearError } = useAuthStore();

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.includes('@')) e.email = 'Please enter a valid email';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    try {
      await login(email, password);
      router.replace('/(app)');
    } catch {
      // error is set in store
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0F' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <LinearGradient
              colors={['#7B61FF', '#00D4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 40 }}>♟</Text>
            </LinearGradient>
            <Text
              style={{
                color: '#F8F8FF',
                fontSize: 32,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              Chess Platform
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 15, marginTop: 8 }}>
              Welcome back, Grandmaster
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: '#16161A',
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: '#2A2A35',
            }}
          >
            <Text
              style={{
                color: '#F8F8FF',
                fontSize: 22,
                fontWeight: '700',
                marginBottom: 24,
              }}
            >
              Sign In
            </Text>

            {error && (
              <View
                style={{
                  backgroundColor: '#2D1515',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#EF4444',
                }}
              >
                <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>
              </View>
            )}

            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={errors.email}
            />
            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              isPassword
              error={errors.password}
            />

            <GradientButton
              label="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Footer */}
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}
          >
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={{ color: '#7B61FF', fontSize: 14, fontWeight: '700' }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
