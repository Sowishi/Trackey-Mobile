import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  onUserPress?: () => void;
  profilePicUrl?: string;
  onBackPress?: () => void;
}

export function ScreenHeader({ title, onUserPress, profilePicUrl, onBackPress }: ScreenHeaderProps) {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#0078b5',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
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
      color: '#FFFFFF',
    },
    userIcon: {
      padding: 8,
    },
    profilePicture: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    profilePicturePlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {onBackPress && (
          <TouchableOpacity 
            onPress={onBackPress}
            style={{ marginRight: 12, padding: 4 }}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
        <Image 
          source={require('../assets/images/aquabill-logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      {onUserPress && (
        <TouchableOpacity 
          style={styles.userIcon}
          onPress={onUserPress}
        >
          {profilePicUrl ? (
            <Image
              source={{ uri: profilePicUrl }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons 
                name="person" 
                size={24} 
                color="#FFFFFF"
              />
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

