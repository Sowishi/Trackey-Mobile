import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colorScheme = useColorScheme();

  const handleLogin = () => {
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

    // For demo purposes, accept any email/password combination
    // In a real app, you'd authenticate with your backend
    Alert.alert('Success', 'Login successful!', [
      {
        text: 'OK',
        onPress: () => router.replace('/(tabs)'),
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      justifyContent: 'center',
      paddingHorizontal: 20,
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
      marginBottom: 40,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: Colors[colorScheme ?? 'light'].text,
    },
    input: {
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      color: Colors[colorScheme ?? 'light'].text,
    },
    loginButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    loginButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View>
        <Text style={styles.title}>Welcome to Struxis</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
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

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.demoText}>
          Demo: Enter any email and password to login
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
