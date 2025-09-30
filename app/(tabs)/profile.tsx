import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample user data
const sampleUser = {
  id: 'USER001',
  name: 'John Mitchell',
  email: 'john.mitchell@trackey.com',
  phone: '+1 (555) 123-4567',
  department: 'Field Operations',
  role: 'Senior Tracker',
  joinDate: '2023-01-15',
  lastActive: '2024-09-30T14:30:00Z',
  avatar: null, // Using default avatar
  stats: {
    totalTracks: 1247,
    activeDevices: 8,
    completedMissions: 89,
    accuracy: 98.5
  },
  preferences: {
    notifications: true,
    locationSharing: true,
    darkMode: false,
    language: 'English'
  }
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState(sampleUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedEmail, setEditedEmail] = useState(user.email);
  const [editedPhone, setEditedPhone] = useState(user.phone);

  const handleSave = () => {
    setUser({
      ...user,
      name: editedName,
      email: editedEmail,
      phone: editedPhone
    });
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedEmail(user.email);
    setEditedPhone(user.phone);
    setIsEditing(false);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    scrollContent: {
      padding: 20,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 30,
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
    },
    avatarText: {
      fontSize: 48,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    nameText: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    roleText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].primary,
      marginBottom: 8,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10B981',
      marginRight: 6,
    },
    statusText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].primary,
      fontWeight: '500',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: Colors[colorScheme ?? 'light'].primary,
    },
    card: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border + '30',
    },
    infoIcon: {
      marginRight: 12,
      width: 24,
    },
    infoLabel: {
      flex: 1,
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
    },
    input: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].text,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].primary,
      paddingVertical: 4,
      minWidth: 120,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      textAlign: 'center',
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    editButton: {
      position: 'absolute',
      top: 16,
      right: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    editButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    saveButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    saveButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 8,
      paddingVertical: 12,
      marginRight: 8,
      alignItems: 'center',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault,
      borderRadius: 8,
      paddingVertical: 12,
      marginLeft: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>User Profile</ThemedText>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <ThemedText style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <ThemedText style={styles.avatarText}>
                {getInitials(user.name)}
              </ThemedText>
            </View>
            <ThemedText style={styles.nameText}>{user.name}</ThemedText>
            <ThemedText style={styles.roleText}>{user.role}</ThemedText>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <ThemedText style={styles.statusText}>Active</ThemedText>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoLabel}>Full Name</ThemedText>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter name"
                  />
                ) : (
                  <ThemedText style={styles.infoValue}>{user.name}</ThemedText>
                )}
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoLabel}>Email</ThemedText>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedEmail}
                    onChangeText={setEditedEmail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                  />
                ) : (
                  <ThemedText style={styles.infoValue}>{user.email}</ThemedText>
                )}
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons 
                  name="call-outline" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoLabel}>Phone</ThemedText>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedPhone}
                    onChangeText={setEditedPhone}
                    placeholder="Enter phone"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <ThemedText style={styles.infoValue}>{user.phone}</ThemedText>
                )}
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons 
                  name="business-outline" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoLabel}>Department</ThemedText>
                <ThemedText style={styles.infoValue}>{user.department}</ThemedText>
              </View>
              
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoLabel}>Join Date</ThemedText>
                <ThemedText style={styles.infoValue}>{formatDate(user.joinDate)}</ThemedText>
              </View>
            </View>
          </View>

          {/* Statistics */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{user.stats.totalTracks.toLocaleString()}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Tracks</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{user.stats.activeDevices}</ThemedText>
                <ThemedText style={styles.statLabel}>Active Devices</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{user.stats.completedMissions}</ThemedText>
                <ThemedText style={styles.statLabel}>Completed Missions</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{user.stats.accuracy}%</ThemedText>
                <ThemedText style={styles.statLabel}>Accuracy Rate</ThemedText>
              </View>
            </View>
          </View>

          {isEditing && (
            <View style={styles.saveButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
