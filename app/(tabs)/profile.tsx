import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, getDocs, query, where } from '../../firebase';

interface UserProfile {
  id?: string;
  age?: number;
  contactNumber?: string;
  createdAt?: string;
  email: string;
  fullName: string;
  gender?: string;
  password?: string;
  passwordChanged?: boolean;
  profilePicUrl?: string;
  role: string;
  status: string;
  meterNumber?: string;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user: contextUser, setUser: setContextUser } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contextUser) {
      router.replace('/login');
      return;
    }

    fetchUserProfile();
  }, [contextUser]);

  const fetchUserProfile = async () => {
    if (!contextUser?.email) {
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', contextUser.email));

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        setUserProfile({
          id: userDoc.id,
          age: userData.age,
          contactNumber: userData.contactNumber,
          createdAt: userData.createdAt,
          email: userData.email,
          fullName: userData.fullName || userData.name || contextUser.name,
          gender: userData.gender,
          password: userData.password,
          passwordChanged: userData.passwordChanged,
          profilePicUrl: userData.profilePicUrl,
          role: userData.role || userData.position || contextUser.position,
          status: userData.status,
          meterNumber: userData.meterNumber,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!contextUser) {
    return null;
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
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      paddingBottom: 50
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    profileCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      marginTop: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
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
      borderWidth: 3,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
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
    roleText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].primary,
      textAlign: 'center',
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    infoSection: {
      marginTop: 8,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      marginBottom: 10,
    },
    infoIcon: {
      marginRight: 12,
      marginTop: 2,
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
      fontSize: 15,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '600',
    },
    logoutSection: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    logoutButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: Colors[colorScheme ?? 'light'].primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    logoutIcon: {
      marginRight: 10,
    },
    logoutButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Profile" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayUser = userProfile || {
    email: contextUser.email,
    fullName: contextUser.name,
    role: contextUser.position,
    gender: contextUser.gender,
    meterNumber: contextUser.rfid,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Profile" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {displayUser.profilePicUrl ? (
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: displayUser.profilePicUrl }}
                  style={styles.avatarImage}
                />
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(displayUser.fullName)}
                </Text>
              </View>
            )}
            <Text style={styles.nameText}>{displayUser.fullName}</Text>
            <Text style={styles.roleText}>{displayUser.role}</Text>
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
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{displayUser.email}</Text>
              </View>
            </View>

            {displayUser.contactNumber && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="call"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Contact Number</Text>
                  <Text style={styles.infoValue}>{displayUser.contactNumber}</Text>
                </View>
              </View>
            )}

            {displayUser.gender && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{displayUser.gender}</Text>
                </View>
              </View>
            )}

            {displayUser.age && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{displayUser.age} years old</Text>
                </View>
              </View>
            )}

            {displayUser.meterNumber && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="flash"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Meter Number</Text>
                  <Text style={styles.infoValue}>{displayUser.meterNumber}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={Colors[colorScheme ?? 'light'].primary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>
                  {displayUser.status ? displayUser.status.charAt(0).toUpperCase() + displayUser.status.slice(1) : 'N/A'}
                </Text>
              </View>
            </View>

            {displayUser.createdAt && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="time"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>{formatDate(displayUser.createdAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons
              name="log-out"
              size={20}
              color="white"
              style={styles.logoutIcon}
            />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
