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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "person" : "person-outline"} 
              color={color} 
            />
          ),
        }}
      />
         <Tabs.Screen
        name="index"
        options={{
          title: 'Tracking',
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
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "calendar" : "calendar-outline"} 
              color={color} 
            />
          ),
        }}
      />
     
      <Tabs.Screen
        name="keyswitch"
        options={{
          title: 'Key Switch',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "toggle" : "toggle-outline"} 
              color={color} 
            />
          ),
        }}
      />
    
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={focused ? 32 : 28} 
              name={focused ? "document-text" : "document-text-outline"} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
