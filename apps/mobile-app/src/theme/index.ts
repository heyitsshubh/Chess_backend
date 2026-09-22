// ============================================================
// Material Design 3 Theme
// ============================================================
import { MD3DarkTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

export const AppTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#BB86FC",
    onPrimary: "#100030",
    primaryContainer: "#6200EA",
    onPrimaryContainer: "#E9DDFF",
    secondary: "#FFD700",
    onSecondary: "#3E2E00",
    secondaryContainer: "#5C4300",
    onSecondaryContainer: "#FFE082",
    background: "#0D0D0F",
    onBackground: "#E8E0F0",
    surface: "#1C1B1F",
    onSurface: "#E8E0F0",
    surfaceVariant: "#1E1A2E",
    onSurfaceVariant: "#CAC4D0",
    error: "#CF6679",
    onError: "#680020",
    errorContainer: "#93000A",
    onErrorContainer: "#FFB4AB",
    outline: "#938F99",
    outlineVariant: "#49454F",
    elevation: {
      level0: "transparent",
      level1: "#1E1A2E",
      level2: "#232038",
      level3: "#272441",
      level4: "#282547",
      level5: "#2B2850",
    },
  },
};

export const MD_COLORS = {
  primary: "#BB86FC",
  primaryContainer: "#6200EA",
  secondary: "#FFD700",
  background: "#0D0D0F",
  surface: "#1C1B1F",
  surfaceVariant: "#1E1A2E",
  onSurface: "#E8E0F0",
  onSurfaceVariant: "#CAC4D0",
  outline: "#938F99",
  error: "#CF6679",
  win: "#66BB6A",
  draw: "#FFD700",
  loss: "#CF6679",
};
