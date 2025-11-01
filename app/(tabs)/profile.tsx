import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, doc, getDocs, query, updateDoc, where } from '../../firebase';

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
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingPicture, setChangingPicture] = useState(false);

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

  const handleChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  };

  const handleSubmitPasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    // Verify current password
    if (userProfile.password !== currentPassword) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }

    setChangingPassword(true);

    try {
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, {
        password: newPassword,
        passwordChanged: true,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setUserProfile({
        ...userProfile,
        password: newPassword,
        passwordChanged: true,
      });

      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeProfilePicture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos to change your profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setChangingPicture(true);

        try {
          if (!userProfile?.id) {
            Alert.alert('Error', 'User information not available');
            return;
          }

          // Update profile picture in Firestore
          const userRef = doc(db, 'users', userProfile.id);
          await updateDoc(userRef, {
            profilePicUrl: imageUri,
            updatedAt: new Date().toISOString(),
          });

          // Update local state
          setUserProfile({
            ...userProfile,
            profilePicUrl: imageUri,
          });

          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (error) {
          console.error('Error updating profile picture:', error);
          Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        } finally {
          setChangingPicture(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
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
    editIconOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].background,
    },
    actionButtons: {
      marginTop: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    modalFooter: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme ?? 'light'].border,
    },
    modalCancelButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      marginRight: 12,
    },
    modalCancelText: {
      color: Colors[colorScheme ?? 'light'].text,
      fontSize: 16,
      fontWeight: '600',
    },
    modalSubmitButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    modalSubmitText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    disabledButton: {
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
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeProfilePicture}
              disabled={changingPicture}
            >
              {changingPicture ? (
                <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
              ) : displayUser.profilePicUrl ? (
                <Image
                  source={{ uri: displayUser.profilePicUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials(displayUser.fullName)}
                </Text>
              )}
              <View style={styles.editIconOverlay}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleChangePassword}
            >
              <Ionicons
                name="lock-closed"
                size={20}
                color={Colors[colorScheme ?? 'light'].primary}
              />
              <Text style={styles.actionButtonText}>Update</Text>
            </TouchableOpacity>
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

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPasswordModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm new password"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelButton, changingPassword && styles.disabledButton]}
                onPress={() => setPasswordModalVisible(false)}
                disabled={changingPassword}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, changingPassword && styles.disabledButton]}
                onPress={handleSubmitPasswordChange}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.modalSubmitText}>Change Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
