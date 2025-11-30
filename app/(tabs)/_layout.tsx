import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { collection, db, getDocs, onSnapshot, query, where } from '../../firebase';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if user is a resident
  const isResident = user?.position?.toLowerCase() === 'resident' || user?.position?.toLowerCase() === 'residents';
  const isCollector = !isResident;

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    if (!user?.email) {
      setUnreadCount(0);
      return;
    }

    try {
      let notificationsQuery;
      
      if (isCollector) {
        // For collectors, get all notifications
        notificationsQuery = query(collection(db, 'notifications'));
      } else {
        // For residents, get only their notifications
        notificationsQuery = query(
          collection(db, 'notifications'),
          where('userEmail', '==', user.email)
        );
      }
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      let count = 0;

      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Count unread notifications, excluding filtered ones for collectors
        if (data.status === 'unread') {
          if (isCollector) {
            // Filter out bill_created, bill reminders, and payment approval/rejection for collectors
            if (
              data.type !== 'bill_created' &&
              data.title !== 'Bill Reminder' &&
              data.title !== 'Payment Approved' &&
              data.title !== 'Payment Rejected'
            ) {
              count++;
            }
          } else {
            count++;
          }
        }
      });

   

      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!user?.email) {
      setUnreadCount(0);
      return;
    }

    // Set up real-time listener for notifications
    let notificationsUnsubscribe: (() => void) | null = null;
    let notificationCount = 0;

    const updateTotalCount = () => {
      setUnreadCount(notificationCount);
    };

    try {
      let notificationsQuery;
      
      if (isCollector) {
        notificationsQuery = query(collection(db, 'notifications'));
      } else {
        notificationsQuery = query(
          collection(db, 'notifications'),
          where('userEmail', '==', user.email)
        );
      }
      
      // Set up real-time listener for notifications
      notificationsUnsubscribe = onSnapshot(
        notificationsQuery,
        (notificationsSnapshot) => {
          notificationCount = 0;

          notificationsSnapshot.forEach((doc) => {
            const data = doc.data();
            // Count unread notifications, excluding filtered ones for collectors
            if (data.status === 'unread') {
              if (isCollector) {
                // Filter out bill_created, bill reminders, and payment approval/rejection for collectors
                if (
                  data.type !== 'bill_created' &&
                  data.title !== 'Bill Reminder' &&
                  data.title !== 'Payment Approved' &&
                  data.title !== 'Payment Rejected'
                ) {
                  notificationCount++;
                }
              } else {
                notificationCount++;
              }
            }
          });

          updateTotalCount();
        },
        (error) => {
          console.error('Error listening to notifications:', error);
          setUnreadCount(0);
        }
      );
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
      setUnreadCount(0);
    }

    // Cleanup function
    return () => {
      if (notificationsUnsubscribe) {
        notificationsUnsubscribe();
      }
    };
  }, [user, isCollector]);

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
            <View style={styles.iconContainer}>
              <Ionicons 
                size={focused ? 32 : 28} 
                name={focused ? "notifications" : "notifications-outline"} 
                color={color} 
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
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
    <Tabs.Screen
      name="billing-information"
      options={{
        href: null, // 👈 this removes it from the bottom tab bar
      }}
    />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0078b5',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
