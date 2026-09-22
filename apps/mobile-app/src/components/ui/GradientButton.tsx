// ============================================================
// GradientButton — Material Design 3 contained Button
// ============================================================
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Button } from "react-native-paper";

interface Props {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
  mode?: "contained" | "outlined" | "text" | "contained-tonal" | "elevated";
  icon?: string;
  disabled?: boolean;
}

export function GradientButton({
  label,
  onPress,
  isLoading,
  style,
  mode = "contained",
  icon,
  disabled,
}: Props) {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={isLoading}
      disabled={disabled || isLoading}
      icon={icon}
      contentStyle={styles.content}
      labelStyle={styles.label}
      style={[styles.button, style]}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12 },
  content: { height: 52, flexDirection: "row-reverse" },
  label: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});
