/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0077b6'; // Blue
const tintColorDark = '#0077b6'; // Blue for dark mode

export const Colors = {
  light: {
    text: '#1F2937', // Dark gray text
    background: '#FFFFFF', // Pure white
    tint: tintColorLight,
    icon: '#6B7280', // Gray icons
    tabIconDefault: '#9CA3AF', // Light gray for inactive tabs
    tabIconSelected: tintColorLight, // Blue for active tabs
    primary: '#0077b6', // Primary blue
    secondary: '#90E0EF', // Light blue
    accent: '#E0F7FA', // Very light blue background
    border: '#E5E7EB', // Light gray borders
  },
  dark: {
    text: '#1F2937', // Dark gray text (same as light mode for consistency)
    background: '#FFFFFF', // Pure white (same as light mode)
    tint: tintColorLight, // Use same blue as light mode
    icon: '#6B7280', // Gray icons (same as light mode)
    tabIconDefault: '#9CA3AF', // Light gray for inactive tabs (same as light mode)
    tabIconSelected: tintColorLight, // Blue for active tabs (same as light mode)
    primary: '#0077b6', // Primary blue (same as light mode)
    secondary: '#90E0EF', // Light blue (same as light mode)
    accent: '#E0F7FA', // Very light blue background (same as light mode)
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
