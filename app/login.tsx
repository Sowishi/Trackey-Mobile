import { User, useUser } from '@/contexts/UserContext';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useUser();

  const handleLogin = async () => {
    // Simple validation
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Please fill in all fields');
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
      // Query users collection in Firestore
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', email.toLowerCase().trim()),
        where('password', '==', password.trim()),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      let authenticatedUser: User | null = null;

      if (!querySnapshot.empty) {
        // Get the first matching user document
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // Check if user is not archived
        if (userData.isArchived !== true) {
          // Map database fields to User interface
          authenticatedUser = {
            email: userData.email || '',
            gender: userData.gender || '',
            name: userData.fullName || userData.name || '', // Support both fullName and name
            password: userData.password || '',
            position: userData.role || userData.position || '', // Support both role and position
            rfid: userData.meterNumber || userData.rfid || '', // Support both meterNumber and rfid
            profilePicUrl: userData.profilePicUrl || '', // Include profile picture URL
            passwordChanged: userData.passwordChanged || false // Include passwordChanged status
          };
        }
      }

      setLoading(false);

      if (authenticatedUser) {
        // Set user in context
        setUser(authenticatedUser);
        
        // Enhanced welcome message
        const welcomeMessage = `Welcome, ${authenticatedUser.name}! 🎉\n\nYou've successfully logged in.`;
        
        Alert.alert('Login Successful', welcomeMessage, [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        Alert.alert('Error', 'Invalid email or password. Please check your credentials and try again.');
      }

    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
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
      fontSize: 36,
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
    eyeIcon: {
      marginRight: 16,
      padding: 4,
    },
    loginButton: {
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
    loginButtonText: {
      color: white,
      fontSize: 18,
      fontWeight: '600',
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    demoText: {
      textAlign: 'center',
      marginTop: 20,
      color: white,
      opacity: 0.9,
      fontSize: 14,
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

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={aquabillBlue}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={aquabillBlue}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" style={styles.buttonIcon} />
                  ) : (
                    <Ionicons name="log-in-outline" size={20} color="white" style={styles.buttonIcon} />
                  )}
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing In...' : 'Log in'}
                  </Text>
                </TouchableOpacity>

              
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
