import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function SeismicVibrationScreen() {
  const colorScheme = useColorScheme();

  const vibrationData = [
    { id: 1, location: 'Sensor A', magnitude: 2.3, frequency: '15 Hz', timestamp: '14:30:15' },
    { id: 2, location: 'Sensor B', magnitude: 1.8, frequency: '12 Hz', timestamp: '14:30:10' },
    { id: 3, location: 'Sensor C', magnitude: 3.1, frequency: '18 Hz', timestamp: '14:30:05' },
    { id: 4, location: 'Sensor D', magnitude: 0.9, frequency: '8 Hz', timestamp: '14:30:00' },
  ];

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 3.0) return '#ff4444';
    if (magnitude >= 2.0) return '#ffaa00';
    return '#44ff44';
  };

  const getMagnitudeLevel = (magnitude: number) => {
    if (magnitude >= 3.0) return 'High';
    if (magnitude >= 2.0) return 'Medium';
    return 'Low';
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Seismic Vibration</ThemedText>
        <ThemedText style={styles.subtitle}>
          Real-time vibration monitoring and analysis
        </ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {vibrationData.map((item) => (
          <ThemedView key={item.id} style={styles.dataCard}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.sensorText}>{item.location}</ThemedText>
              <View style={[styles.magnitudeBadge, { backgroundColor: getMagnitudeColor(item.magnitude) + '20' }]}>
                <ThemedText style={[styles.magnitudeText, { color: getMagnitudeColor(item.magnitude) }]}>
                  {getMagnitudeLevel(item.magnitude)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Magnitude</ThemedText>
                <ThemedText style={[styles.metricValue, { color: getMagnitudeColor(item.magnitude) }]}>
                  {item.magnitude}
                </ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Frequency</ThemedText>
                <ThemedText style={styles.metricValue}>{item.frequency}</ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.timestampText}>{item.timestamp}</ThemedText>
          </ThemedView>
        ))}
        
        <ThemedView style={styles.chartPlaceholder}>
          <ThemedText style={styles.chartTitle}>Vibration Chart</ThemedText>
          <View style={[styles.chartArea, { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10' }]}>
            <ThemedText style={styles.chartPlaceholderText}>
              Real-time vibration waveform will be displayed here
            </ThemedText>
          </View>
        </ThemedView>
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
    marginBottom: 12,
  },
  sensorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  magnitudeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  magnitudeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timestampText: {
    fontSize: 12,
    opacity: 0.6,
  },
  chartPlaceholder: {
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartArea: {
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
