import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "map" : "map-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="overload"
        options={{
          title: 'Overload Collection',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "albums" : "albums-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="seismic"
        options={{
          title: 'Seismic Vibration',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "pulse" : "pulse-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "information-circle" : "information-circle-outline"} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
