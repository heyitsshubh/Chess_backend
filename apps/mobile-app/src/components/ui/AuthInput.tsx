// ============================================================
// AuthInput Component
//
// Glassmorphic styled input for auth forms.
// ============================================================
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function AuthInput({ label, error, isPassword = false, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: '#9CA3AF',
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1C1C22',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? '#EF4444' : '#2A2A35',
        }}
      >
        <TextInput
          {...props}
          secureTextEntry={isPassword && !visible}
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 16,
            color: '#F8F8FF',
            fontSize: 16,
          }}
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            style={{ paddingHorizontal: 14 }}
          >
            <Text style={{ color: '#7B61FF', fontSize: 13, fontWeight: '600' }}>
              {visible ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}
