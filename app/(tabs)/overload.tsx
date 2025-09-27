import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function OverloadCollectionScreen() {
  const colorScheme = useColorScheme();

  const sampleData = [
    { id: 1, location: 'Building A - Floor 3', load: '85%', status: 'Warning', timestamp: '2024-01-15 14:30' },
    { id: 2, location: 'Building B - Floor 1', load: '45%', status: 'Normal', timestamp: '2024-01-15 14:25' },
    { id: 3, location: 'Building C - Floor 2', load: '92%', status: 'Critical', timestamp: '2024-01-15 14:20' },
    { id: 4, location: 'Building A - Floor 1', load: '67%', status: 'Normal', timestamp: '2024-01-15 14:15' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return '#ff4444';
      case 'Warning': return '#ffaa00';
      case 'Normal': return '#44ff44';
      default: return Colors[colorScheme ?? 'light'].text;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Overload Collection</ThemedText>
        <ThemedText style={styles.subtitle}>
          Monitor structural load conditions across buildings
        </ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sampleData.map((item) => (
          <ThemedView key={item.id} style={styles.dataCard}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.locationText}>{item.location}</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.loadText}>Load: {item.load}</ThemedText>
            <ThemedText style={styles.timestampText}>{item.timestamp}</ThemedText>
          </ThemedView>
        ))}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  dataCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadText: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  timestampText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
