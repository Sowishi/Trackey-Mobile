/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#DC2626'; // Red
const tintColorDark = '#EF4444'; // Lighter red for dark mode

export const Colors = {
  light: {
    text: '#1F2937', // Dark gray text
    background: '#FFFFFF', // Pure white
    tint: tintColorLight,
    icon: '#6B7280', // Gray icons
    tabIconDefault: '#9CA3AF', // Light gray for inactive tabs
    tabIconSelected: tintColorLight, // Red for active tabs
    primary: '#DC2626', // Primary red
    secondary: '#FECACA', // Light red/pink
    accent: '#FEF2F2', // Very light red background
    border: '#E5E7EB', // Light gray borders
  },
  dark: {
    text: '#1F2937', // Dark gray text (same as light mode for consistency)
    background: '#FFFFFF', // Pure white (same as light mode)
    tint: tintColorLight, // Use same red as light mode
    icon: '#6B7280', // Gray icons (same as light mode)
    tabIconDefault: '#9CA3AF', // Light gray for inactive tabs (same as light mode)
    tabIconSelected: tintColorLight, // Red for active tabs (same as light mode)
    primary: '#DC2626', // Primary red (same as light mode)
    secondary: '#FECACA', // Light red/pink (same as light mode)
    accent: '#FEF2F2', // Very light red background (same as light mode)
    border: '#E5E7EB', // Light gray borders (same as light mode)
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
