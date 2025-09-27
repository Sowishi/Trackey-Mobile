import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      marginBottom: 30,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerIcon: {
      marginRight: 12,
    },
    subtitle: {
      opacity: 0.7,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionIcon: {
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    infoText: {
      fontSize: 14,
      lineHeight: 20,
      opacity: 0.8,
    },
    featureText: {
      fontSize: 14,
      lineHeight: 22,
      opacity: 0.8,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 4,
    },
    linkIcon: {
      marginRight: 8,
    },
    linkText: {
      fontSize: 14,
      color: '#007AFF',
      textDecorationLine: 'underline',
    },
    logoutButton: {
      backgroundColor: '#ff4444',
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // In a real app, you'd clear authentication state here
            // For now, we'll just show an alert
            Alert.alert('Logged out', 'You have been logged out successfully.');
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons 
                name="information-circle" 
                size={28} 
                color={Colors[colorScheme ?? 'light'].tint} 
                style={styles.headerIcon}
              />
              <ThemedText type="title">About Struxis</ThemedText>
            </View>
            <ThemedText style={styles.subtitle}>
              Structural monitoring and analysis platform
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons 
                name="phone-portrait" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>App Information</ThemedText>
            </View>
            <ThemedText style={styles.infoText}>
              Version: 1.0.0{'\n'}
              Build: 2024.01.15{'\n'}
              Platform: React Native with Expo
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons 
                name="star" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>Features</ThemedText>
            </View>
            <ThemedText style={styles.featureText}>
              • Real-time structural monitoring{'\n'}
              • Overload collection and analysis{'\n'}
              • Seismic vibration detection{'\n'}
              • Interactive mapping interface{'\n'}
              • Data visualization and reporting
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons 
                name="mail" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>Contact & Support</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => openLink('mailto:support@struxis.com')}
            >
              <Ionicons name="mail-outline" size={16} color="#007AFF" style={styles.linkIcon} />
              <ThemedText style={styles.linkText}>support@struxis.com</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => openLink('https://struxis.com')}
            >
              <Ionicons name="globe-outline" size={16} color="#007AFF" style={styles.linkIcon} />
              <ThemedText style={styles.linkText}>www.struxis.com</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons 
                name="document-text" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>Legal</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content would be displayed here.')}
            >
              <Ionicons name="shield-outline" size={16} color="#007AFF" style={styles.linkIcon} />
              <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => Alert.alert('Terms of Service', 'Terms of service content would be displayed here.')}
            >
              <Ionicons name="document-outline" size={16} color="#007AFF" style={styles.linkIcon} />
              <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
              <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

