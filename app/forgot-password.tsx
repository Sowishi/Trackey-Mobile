import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, getDocs, query, where } from '../firebase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const sendPasswordEmail = async (userEmail: string) => {
    // Fake email sending - just show a message
    Alert.alert(
      'Password Sent',
      'Please check your email for your password.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleResetPassword = async () => {
    // Simple validation
    if (email.trim() === '') {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Query users collection in Firestore to find the user
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', email.toLowerCase().trim()),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoading(false);
        Alert.alert('Error', 'No account found with this email address. Please check your email and try again.');
        return;
      }

      // Get the first matching user document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check if user is not archived
      if (userData.isArchived === true) {
        setLoading(false);
        Alert.alert('Error', 'This account has been archived. Please contact support.');
        return;
      }

      // Send password to email (fake for now)
      await sendPasswordEmail(email.toLowerCase().trim());

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Password reset error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Aquabill blue and white theme colors
  const aquabillBlue = '#007AFF';
  const white = '#FFFFFF';
  const textDark = '#1F2937';
  const textLight = '#FFFFFF';

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for better text readability
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      width: 200,
      height: 200,
      resizeMode: 'contain',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: white,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: white,
      opacity: 0.9,
      marginBottom: 32,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    form: {
      width: '100%',
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: white,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: white,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    inputIcon: {
      marginLeft: 16,
      marginRight: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      paddingRight: 8,
      fontSize: 16,
      color: textDark,
    },
    resetButton: {
      backgroundColor: aquabillBlue,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    buttonIcon: {
      marginRight: 8,
    },
    resetButtonText: {
      color: white,
      fontSize: 18,
      fontWeight: '600',
    },
    resetButtonDisabled: {
      opacity: 0.7,
    },
    backButton: {
      marginTop: 16,
      alignItems: 'center',
    },
    backButtonText: {
      color: white,
      fontSize: 14,
      fontWeight: '500',
      textDecorationLine: 'underline',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../assets/images/lupet.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <Image 
                  source={require('../assets/images/aquabill-logo.png')}
                  style={styles.logo}
                />
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you your password
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={aquabillBlue}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" style={styles.buttonIcon} />
                  ) : (
                    <Ionicons name="mail-outline" size={20} color="white" style={styles.buttonIcon} />
                  )}
                  <Text style={styles.resetButtonText}>
                    {loading ? 'Sending...' : 'Send Password'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

