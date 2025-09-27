import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
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
    header: {
      marginBottom: 20,
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
    mapContainer: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    mapPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
    },
    mapIcon: {
      marginBottom: 16,
    },
    placeholderText: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    placeholderSubtext: {
      fontSize: 16,
      opacity: 0.6,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons 
              name="map" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">Map</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Interactive map view for monitoring and analysis
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.mapContainer}>
          <View style={[styles.mapPlaceholder, { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20' }]}>
            <Ionicons 
              name="map-outline" 
              size={60} 
              color={Colors[colorScheme ?? 'light'].tabIconDefault} 
              style={styles.mapIcon}
            />
            <ThemedText style={styles.placeholderText}>
              Map View
            </ThemedText>
            <ThemedText style={styles.placeholderSubtext}>
              Interactive map will be displayed here
            </ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}