// ============================================================
// AuthInput — Material Design 3 TextInput wrapper
// ============================================================
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, HelperText, useTheme } from "react-native-paper";
import type { TextInputProps } from "react-native-paper";

interface Props extends Omit<TextInputProps, "mode" | "error"> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function AuthInput({ label, error, isPassword = false, ...props }: Props) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        label={label}
        mode="outlined"
        secureTextEntry={isPassword && !visible}
        right={
          isPassword ? (
            <TextInput.Icon
              icon={visible ? "eye-off" : "eye"}
              onPress={() => setVisible((v) => !v)}
              color={theme.colors.primary}
            />
          ) : undefined
        }
        error={!!error}
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
        outlineStyle={styles.outline}
        contentStyle={styles.content}
        textColor={theme.colors.onSurface}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? (
        <HelperText type="error" visible={!!error} style={styles.helper}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

AuthInput.Icon = TextInput.Icon;

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  input: { height: 56 },
  outline: { borderRadius: 12 },
  content: { fontSize: 16 },
  helper: { marginTop: -4, marginLeft: -4 },
});
