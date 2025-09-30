import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user: contextUser, setUser: setContextUser } = useUser();

  useEffect(() => {
    if (!contextUser) {
      // If no user is logged in, redirect to login
      router.replace('/login');
      return;
    }
  }, [contextUser]);

  if (!contextUser) {
    return null; // or a loading spinner
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            setContextUser(null);
            router.replace('/login');
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    headerSection: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingTop: 60,
      paddingBottom: 40,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 30,
    },
    profileCard: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 24,
      marginHorizontal: 20,
      marginTop: -20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 4,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    nameText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      textAlign: 'center',
      marginBottom: 8,
    },
    positionText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].primary,
      textAlign: 'center',
      fontWeight: '600',
    },
    infoSection: {
      marginTop: 20,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      marginBottom: 12,
    },
    infoIcon: {
      marginRight: 16,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '600',
    },
    logoutSection: {
      paddingHorizontal: 20,
      paddingVertical: 30,
    },
    logoutButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: Colors[colorScheme ?? 'light'].primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    logoutIcon: {
      marginRight: 12,
    },
    logoutButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    appInfo: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    appVersion: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 10,
    },
  });


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <ThemedText style={styles.headerTitle}>My Profile</ThemedText>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <ThemedText style={styles.avatarText}>
                {getInitials(contextUser.name)}
              </ThemedText>
            </View>
            <ThemedText style={styles.nameText}>{contextUser.name}</ThemedText>
            <ThemedText style={styles.positionText}>{contextUser.position}</ThemedText>
          </View>

          {/* User Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons 
                  name="mail" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Email Address</ThemedText>
                <ThemedText style={styles.infoValue}>{contextUser.email}</ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons 
                  name="card" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>RFID Number</ThemedText>
                <ThemedText style={styles.infoValue}>{contextUser.rfid}</ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Gender</ThemedText>
                <ThemedText style={styles.infoValue}>{contextUser.gender}</ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons 
                  name="briefcase" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Position</ThemedText>
                <ThemedText style={styles.infoValue}>{contextUser.position}</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="white" style={styles.logoutIcon} />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText style={styles.appVersion}>Trackey v1.0.0</ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
