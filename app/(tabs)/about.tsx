import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function AboutScreen() {
  const colorScheme = useColorScheme();

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
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">About Struxis</ThemedText>
          <ThemedText style={styles.subtitle}>
            Structural monitoring and analysis platform
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>App Information</ThemedText>
          <ThemedText style={styles.infoText}>
            Version: 1.0.0{'\n'}
            Build: 2024.01.15{'\n'}
            Platform: React Native with Expo
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Features</ThemedText>
          <ThemedText style={styles.featureText}>
            • Real-time structural monitoring{'\n'}
            • Overload collection and analysis{'\n'}
            • Seismic vibration detection{'\n'}
            • Interactive mapping interface{'\n'}
            • Data visualization and reporting
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contact & Support</ThemedText>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => openLink('mailto:support@struxis.com')}
          >
            <ThemedText style={styles.linkText}>support@struxis.com</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => openLink('https://struxis.com')}
          >
            <ThemedText style={styles.linkText}>www.struxis.com</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Legal</ThemedText>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content would be displayed here.')}
          >
            <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service content would be displayed here.')}
          >
            <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
    paddingVertical: 8,
    marginBottom: 4,
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
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
