// ============================================================
// Register Screen
//
// Premium registration form with instant validation feedback.
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthInput } from '@/components/ui/AuthInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; username?: string; password?: string }>({});

  const { register, isLoading, error, clearError } = useAuthStore();

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.includes('@')) e.email = 'Please enter a valid email';
    if (username.length < 3 || username.length > 20)
      e.username = 'Username must be 3-20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      e.username = 'Username can only contain letters, numbers, and underscores';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    try {
      await register(email, username, password);
      // Auto-redirect to login
      router.replace('/(auth)/login');
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
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
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
                fontSize: 30,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              Join the Game
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 15, marginTop: 8 }}>
              Start your chess journey today
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
              style={{ color: '#F8F8FF', fontSize: 22, fontWeight: '700', marginBottom: 24 }}
            >
              Create Account
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
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="grandmaster42"
              error={errors.username}
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
              label="Create Account"
              onPress={handleRegister}
              isLoading={isLoading}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Footer */}
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}
          >
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: '#7B61FF', fontSize: 14, fontWeight: '700' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
