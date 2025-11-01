import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  onUserPress?: () => void;
}

export function ScreenHeader({ title, onUserPress }: ScreenHeaderProps) {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    logo: {
      width: 40,
      height: 40,
      resizeMode: 'contain',
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    userIcon: {
      padding: 8,
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <Image 
          source={require('../assets/images/aquabill-logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity 
        style={styles.userIcon}
        onPress={onUserPress}
      >
        <Ionicons 
          name="person-circle-outline" 
          size={32} 
          color={Colors[colorScheme ?? 'light'].primary}
        />
      </TouchableOpacity>
    </View>
  );
}

