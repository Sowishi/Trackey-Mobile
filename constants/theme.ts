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
    text: '#F9FAFB', // Light text
    background: '#111827', // Dark background
    tint: tintColorDark,
    icon: '#9CA3AF', // Gray icons
    tabIconDefault: '#6B7280', // Darker gray for inactive tabs
    tabIconSelected: tintColorDark, // Light red for active tabs
    primary: '#EF4444', // Primary red for dark mode
    secondary: '#7F1D1D', // Dark red
    accent: '#1F2937', // Dark accent
    border: '#374151', // Dark gray borders
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
