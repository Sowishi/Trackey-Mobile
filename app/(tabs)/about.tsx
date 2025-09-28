import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const [appInfo] = useState({
    version: '1.0.0',
    buildDate: '2024.09.28',
    developer: 'Project Watch Team',
    description: 'Advanced monitoring and weather analytics platform'
  });
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      paddingBottom: 50,
    },
    container: {
      flex: 1,
      padding: 20,
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
      fontSize: 14,
    },
    scrollView: {
      flex: 1,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 40,
      paddingVertical: 30,
    },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors[colorScheme ?? 'light'].tint + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    appName: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    appTagline: {
      fontSize: 16,
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: 8,
    },
    appDescription: {
      fontSize: 14,
      opacity: 0.6,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    infoSection: {
      marginBottom: 30,
    },
    sectionCard: {
      backgroundColor: '#2A2A2A',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionIcon: {
      marginRight: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10',
    },
    infoLabel: {
      fontSize: 14,
      opacity: 0.7,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
      textAlign: 'right',
    },
    featureList: {
      paddingLeft: 0,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    featureIcon: {
      marginRight: 12,
      width: 24,
    },
    featureText: {
      fontSize: 14,
      flex: 1,
      opacity: 0.8,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#333333',
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tint + '20',
    },
    linkIcon: {
      marginRight: 12,
    },
    linkText: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
    linkArrow: {
      opacity: 0.5,
    },
    dangerSection: {
      marginTop: 20,
    },
    logoutButton: {
      backgroundColor: '#FF6B35',
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    logoutIcon: {
      marginRight: 12,
    },
    logoutButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    copyright: {
      textAlign: 'center',
      fontSize: 12,
      opacity: 0.5,
      marginTop: 30,
      marginBottom: 20,
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from Project Watch?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Navigate back to login screen
            router.replace('/login');
            
            // Show success message after navigation
            setTimeout(() => {
              Alert.alert('Logged out', 'You have been logged out successfully from Project Watch.');
            }, 100);
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

  const features = [
    { icon: 'cloud', text: 'Real-time weather monitoring and analytics' },
    { icon: 'desktop', text: 'System performance monitoring' },
    { icon: 'analytics', text: 'Advanced data visualization' },
    { icon: 'notifications', text: 'Smart alert system' },
    { icon: 'refresh', text: 'Live data updates' },
    { icon: 'shield-checkmark', text: 'Secure and reliable monitoring' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.titleRow}>
            <Ionicons 
              name="information-circle" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">About Project Watch</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Information and settings for Project Watch
          </ThemedText>
        </Animated.View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.logoContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Ionicons 
                name="eye" 
                size={60} 
                color={Colors[colorScheme ?? 'light'].tint}
              />
            </Animated.View>
            <ThemedText style={styles.appName}>Project Watch</ThemedText>
            <ThemedText style={styles.appTagline}>Monitor • Weather • Analytics</ThemedText>
            <ThemedText style={styles.appDescription}>
              {appInfo.description}
            </ThemedText>
          </Animated.View>

          {/* App Information */}
          <Animated.View 
            style={[
              styles.infoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 25]
                }) }]
              }
            ]}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons 
                  name="phone-portrait" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].tint}
                  style={styles.sectionIcon}
                />
                <ThemedText style={styles.sectionTitle}>App Information</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Version</ThemedText>
                <ThemedText style={styles.infoValue}>{appInfo.version}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Build Date</ThemedText>
                <ThemedText style={styles.infoValue}>{appInfo.buildDate}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Developer</ThemedText>
                <ThemedText style={styles.infoValue}>{appInfo.developer}</ThemedText>
              </View>
              
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <ThemedText style={styles.infoLabel}>Platform</ThemedText>
                <ThemedText style={styles.infoValue}>React Native</ThemedText>
              </View>
            </View>
          </Animated.View>

          {/* Features */}
          <Animated.View 
            style={[
              styles.infoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 35]
                }) }]
              }
            ]}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons 
                  name="star" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].tint}
                  style={styles.sectionIcon}
                />
                <ThemedText style={styles.sectionTitle}>Features</ThemedText>
              </View>
              
              <View style={styles.featureList}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons 
                      name={feature.icon as any} 
                      size={18} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.featureIcon}
                    />
                    <ThemedText style={styles.featureText}>{feature.text}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Support & Links */}
          <Animated.View 
            style={[
              styles.infoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 45]
                }) }]
              }
            ]}
          >
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons 
                  name="help-circle" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].tint}
                  style={styles.sectionIcon}
                />
                <ThemedText style={styles.sectionTitle}>Support & Links</ThemedText>
              </View>
              
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink('mailto:support@projectwatch.com')}
              >
                <Ionicons name="mail" size={18} color={Colors[colorScheme ?? 'light'].tint} style={styles.linkIcon} />
                <ThemedText style={styles.linkText}>Contact Support</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} style={styles.linkArrow} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink('https://projectwatch.com/docs')}
              >
                <Ionicons name="document-text" size={18} color={Colors[colorScheme ?? 'light'].tint} style={styles.linkIcon} />
                <ThemedText style={styles.linkText}>Documentation</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} style={styles.linkArrow} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink('https://github.com/projectwatch')}
              >
                <Ionicons name="logo-github" size={18} color={Colors[colorScheme ?? 'light'].tint} style={styles.linkIcon} />
                <ThemedText style={styles.linkText}>GitHub Repository</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} style={styles.linkArrow} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => Alert.alert('Privacy Policy', 'Your privacy is important to us. Project Watch collects minimal data necessary for monitoring functionality and does not share personal information with third parties.')}
              >
                <Ionicons name="shield-outline" size={18} color={Colors[colorScheme ?? 'light'].tint} style={styles.linkIcon} />
                <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} style={styles.linkArrow} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Logout Section */}
          <Animated.View 
            style={[
              styles.dangerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 55]
                }) }]
              }
            ]}
          >
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
              <ThemedText style={styles.logoutButtonText}>Logout from Project Watch</ThemedText>
            </TouchableOpacity>
          </Animated.View>

          <ThemedText style={styles.copyright}>
            © 2024 Project Watch Team. All rights reserved.
          </ThemedText>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
