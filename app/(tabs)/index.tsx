import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, View } from 'react-native';

export default function MapScreen() {
  const colorScheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Map</ThemedText>
        <ThemedText style={styles.subtitle}>
          Interactive map view for monitoring and analysis
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.mapContainer}>
        <View style={[styles.mapPlaceholder, { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20' }]}>
          <ThemedText style={styles.placeholderText}>
            Map View
          </ThemedText>
          <ThemedText style={styles.placeholderSubtext}>
            Interactive map will be displayed here
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 8,
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