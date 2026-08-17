// ============================================================
// GradientButton Component
//
// Premium gradient CTA button with press animation.
// ============================================================
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  onPress: () => void;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "danger" | "ghost";
}

const GRADIENTS = {
  primary: ["#7B61FF", "#4A3D9E"] as [string, string],
  danger: ["#EF4444", "#B91C1C"] as [string, string],
  ghost: ["#2A2A35", "#1C1C22"] as [string, string],
};

export function GradientButton({
  onPress,
  label,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  variant = "primary",
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[{ borderRadius: 14, overflow: "hidden" }, style]}
    >
      <LinearGradient
        colors={GRADIENTS[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 24,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={[
              {
                color: "#F8F8FF",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.5,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
