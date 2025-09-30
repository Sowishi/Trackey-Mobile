import { Colors } from '@/constants/theme';
import { User, useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database, off, onValue, ref } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
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
      // Reference to the users in the database
      const usersRef = ref(database, 'trackey/users');
      
      // Listen for users data
      onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        let userFound = false;
        let authenticatedUser: User | null = null;

        if (users) {
          // Search through all users to find matching email and password
          Object.keys(users).forEach((userId) => {
            const userData = users[userId];
            if (userData.email === email.trim() && userData.password === password.trim()) {
              userFound = true;
              authenticatedUser = {
                email: userData.email,
                gender: userData.gender,
                name: userData.name,
                password: userData.password,
                position: userData.position,
                rfid: userData.rfid
              };
            }
          });
        }

        setLoading(false);

        if (userFound && authenticatedUser) {
          // Set user in context
          setUser(authenticatedUser);
          
          Alert.alert('Success', `Welcome back, ${authenticatedUser.name}!`, [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]);
        } else {
          Alert.alert('Error', 'Invalid email or password. Please try again.');
        }

        // Clean up the listener
        off(usersRef);
      }, (error) => {
        setLoading(false);
        console.error('Database error:', error);
        Alert.alert('Error', 'Unable to connect to the database. Please try again.');
        off(usersRef);
      });

    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
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
      marginBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: Colors[colorScheme ?? 'light'].text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
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
      color: Colors[colorScheme ?? 'light'].primary,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 12,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    inputIcon: {
      marginLeft: 16,
      marginRight: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      paddingRight: 16,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    loginButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonIcon: {
      marginRight: 8,
    },
    loginButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    demoText: {
      textAlign: 'center',
      marginTop: 20,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons 
              name="location" 
              size={60} 
              color={Colors[colorScheme ?? 'light'].primary} 
              style={styles.logo}
            />
            <Text style={styles.title}>Welcome to Trackey</Text>
            <Text style={styles.subtitle}>Your tracking solution awaits</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
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
                  color={Colors[colorScheme ?? 'light'].primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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
                {loading ? 'Signing In...' : 'Sign In to Trackey'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.demoText}>
              Enter your registered email and password to access Trackey
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
