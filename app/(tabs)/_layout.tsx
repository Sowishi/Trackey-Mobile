import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Check if user is a resident
  const isResident = user?.position?.toLowerCase() === 'resident' || user?.position?.toLowerCase() === 'residents';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#0078b5',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          marginHorizontal: 15,
          borderRadius: 50,
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
          href: isResident ? null : undefined, // Hide from navigation if resident
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
          href: isResident ? null : undefined, // Hide from navigation if resident
        }}
      />
      <Tabs.Screen
        name="payment-history"
        options={{
          title: 'Payment History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "receipt" : "time"} 
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
      <Tabs.Screen
      name="meter-calculator"
      options={{
        href: null, // 👈 this removes it from the bottom tab bar
      }}
    />
    <Tabs.Screen
      name="user-detail"
      options={{
        href: null, // 👈 this removes it from the bottom tab bar
      }}
    />
    <Tabs.Screen
      name="receipt"
      options={{
        href: null, // 👈 this removes it from the bottom tab bar
      }}
    />
    </Tabs>
  );
}
