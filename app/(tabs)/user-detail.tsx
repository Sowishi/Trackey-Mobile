import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, collection, query, where, getDocs } from '../../firebase';

interface UserDetail {
  id: string;
  age?: number;
  contactNumber?: string;
  createdAt?: string;
  email: string;
  fullName: string;
  gender?: string;
  isArchived: boolean;
  meterNumber?: string;
  password?: string;
  passwordChanged?: boolean;
  paymentStatus?: string;
  profilePicUrl?: string;
  role: string;
  status: string;
}

export default function UserDetailScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const { userId, email } = params;
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId || email) {
      fetchUserDetail();
    }
  }, [userId, email]);

  const fetchUserDetail = async () => {
    try {
      const usersRef = collection(db, 'users');
      let q;

      if (userId) {
        // If we have userId, we could query by document ID, but Firestore doesn't support that directly
        // So we'll use email as fallback
        q = query(usersRef, where('email', '==', email));
      } else if (email) {
        q = query(usersRef, where('email', '==', email));
      } else {
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        setUserDetail({
          id: userDoc.id,
          age: userData.age,
          contactNumber: userData.contactNumber,
          createdAt: userData.createdAt,
          email: userData.email,
          fullName: userData.fullName || userData.name || '',
          gender: userData.gender,
          isArchived: userData.isArchived || false,
          meterNumber: userData.meterNumber,
          password: userData.password,
          passwordChanged: userData.passwordChanged,
          paymentStatus: userData.paymentStatus,
          profilePicUrl: userData.profilePicUrl,
          role: userData.role,
          status: userData.status,
        });
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
    } finally {
      setLoading(false);
    }
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
      width: 120,
      height: 120,
      borderRadius: 60,
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
      borderRadius: 60,
    },
    avatarText: {
      fontSize: 42,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    nameText: {
      fontSize: 26,
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
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    statusActive: {
      backgroundColor: '#D1FAE5',
    },
    statusInactive: {
      backgroundColor: '#FEE2E2',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    paymentStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    paymentPaid: {
      backgroundColor: '#D1FAE5',
    },
    paymentUnpaid: {
      backgroundColor: '#FEE2E2',
    },
    paymentText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
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
        <ScreenHeader 
          title="User Details" 
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading user details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userDetail) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="User Details" 
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={Colors[colorScheme ?? 'light'].icon}
          />
          <Text style={styles.loadingText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title="User Details" 
        onUserPress={() => router.push('/(tabs)/profile')}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {userDetail.profilePicUrl ? (
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: userDetail.profilePicUrl }}
                  style={styles.avatarImage}
                />
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(userDetail.fullName)}
                </Text>
              </View>
            )}
            <Text style={styles.nameText}>{userDetail.fullName}</Text>
            <Text style={styles.roleText}>{userDetail.role}</Text>
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
                <Text style={styles.infoValue}>{userDetail.email}</Text>
              </View>
            </View>

            {userDetail.contactNumber && (
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
                  <Text style={styles.infoValue}>{userDetail.contactNumber}</Text>
                </View>
              </View>
            )}

            {userDetail.gender && (
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
                  <Text style={styles.infoValue}>{userDetail.gender}</Text>
                </View>
              </View>
            )}

            {userDetail.age && (
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
                  <Text style={styles.infoValue}>{userDetail.age} years old</Text>
                </View>
              </View>
            )}

            {userDetail.meterNumber && (
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
                  <Text style={styles.infoValue}>{userDetail.meterNumber}</Text>
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
                  {userDetail.status ? userDetail.status.charAt(0).toUpperCase() + userDetail.status.slice(1) : 'N/A'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    userDetail.status === 'active'
                      ? styles.statusActive
                      : styles.statusInactive,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {userDetail.status === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>

            {userDetail.paymentStatus && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="card"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Payment Status</Text>
                  <View
                    style={[
                      styles.paymentStatusBadge,
                      userDetail.paymentStatus === 'paid'
                        ? styles.paymentPaid
                        : styles.paymentUnpaid,
                    ]}
                  >
                    <Text style={styles.paymentText}>
                      {userDetail.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {userDetail.createdAt && (
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
                  <Text style={styles.infoValue}>{formatDate(userDetail.createdAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

