import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "home" : "home-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "people" : "people-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="qrcode"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "qr-code" : "qr-code-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="payment-history"
        options={{
          title: 'Payment History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "receipt" : "receipt-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "notifications" : "notifications-outline"} 
              color={color} 
            />
          ),
        }}
      />
    <Tabs.Screen
  name="profile"
  options={{
    href: null, // 👈 this removes it from the bottom tab bar
  }}
/>

    </Tabs>
  );
}
