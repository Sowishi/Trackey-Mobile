import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
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
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1200,
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

  const handleLogin = async () => {
    // Simple validation - in a real app, you'd validate against a backend
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

    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
      // For demo purposes, accept any email/password combination
      // In a real app, you'd authenticate with your backend
      Alert.alert('Welcome to BNHS Watch!', 'Login successful!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/monitor'),
        },
      ]);
    }, 1500);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#1A0F0A',
    },
    gradientBackground: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
    },
    header: {
      alignItems: 'center',
      marginBottom: 50,
    },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 2,
      borderColor: 'rgba(249, 115, 22, 0.3)',
      elevation: 10,
      shadowColor: '#F97316',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    logo: {
      marginBottom: 8,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: '#94A3B8',
      marginBottom: 8,
    },
    schoolBadge: {
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(249, 115, 22, 0.3)',
    },
    schoolText: {
      color: '#F97316',
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    formContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 24,
      padding: 32,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: '#E2E8F0',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 16,
      height: 56,
    },
    inputWrapperFocused: {
      borderColor: '#F97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#FFFFFF',
      paddingVertical: 0,
    },
    eyeIcon: {
      padding: 4,
    },
    loginButton: {
      backgroundColor: '#F97316',
      borderRadius: 16,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
      elevation: 8,
      shadowColor: '#F97316',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    loginButtonDisabled: {
      backgroundColor: 'rgba(249, 115, 22, 0.5)',
      elevation: 0,
      shadowOpacity: 0,
    },
    buttonIcon: {
      marginRight: 8,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    demoContainer: {
      marginTop: 32,
      padding: 20,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    demoTitle: {
      color: '#3B82F6',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
    },
    demoText: {
      textAlign: 'center',
      color: '#94A3B8',
      fontSize: 12,
      lineHeight: 18,
    },
    floatingElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    },
    floatingCircle: {
      position: 'absolute',
      borderRadius: 50,
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#1A0F0A', '#2D1B0E', '#3D2817']}
        style={styles.gradientBackground}
      >
        {/* Floating Background Elements */}
        <View style={styles.floatingElements}>
          <Animated.View 
            style={[
              styles.floatingCircle,
              {
                width: 100,
                height: 100,
                top: height * 0.1,
                left: width * 0.1,
                transform: [{ scale: pulseAnim }],
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingCircle,
              {
                width: 60,
                height: 60,
                top: height * 0.2,
                right: width * 0.15,
                transform: [{ scale: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [1.1, 1]
                }) }],
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingCircle,
              {
                width: 80,
                height: 80,
                bottom: height * 0.15,
                left: width * 0.2,
                transform: [{ scale: pulseAnim }],
              }
            ]} 
          />
        </View>

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.logoContainer,
                  { 
                    transform: [
                      { scale: logoAnim },
                      { scale: pulseAnim }
                    ] 
                  }
                ]}
              >
                <Ionicons 
                  name="flash" 
                  size={50} 
                  color="#F97316" 
                  style={styles.logo}
                />
                <Ionicons 
                  name="leaf" 
                  size={20} 
                  color="#F97316" 
                  style={{ position: 'absolute', bottom: 20, right: 20 }}
                />
              </Animated.View>
              
              <Text style={styles.title}>BNHS Watch</Text>
              <Text style={styles.subtitle}>Renewable Energy Monitoring</Text>
              
              <View style={styles.schoolBadge}>
                <Text style={styles.schoolText}>Basud National High School</Text>
              </View>
            </Animated.View>

            {/* Form Section */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 25]
                  }) }]
                }
              ]}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[
                  styles.inputWrapper,
                  email.length > 0 && styles.inputWrapperFocused
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={email.length > 0 ? "#F97316" : "#94A3B8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  password.length > 0 && styles.inputWrapperFocused
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={password.length > 0 ? "#F97316" : "#94A3B8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled
                ]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.loadingText}>Signing In...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Demo Information */}
            <Animated.View 
              style={[
                styles.demoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 35]
                  }) }]
                }
              ]}
            >
              <Text style={styles.demoTitle}>Demo Access</Text>
              <Text style={styles.demoText}>
                Enter any valid email format and password to access the renewable energy monitoring system
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
