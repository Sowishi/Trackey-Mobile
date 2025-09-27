import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function SeismicVibrationScreen() {
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
    sensorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sensorIcon: {
      marginRight: 8,
    },
    sensorText: {
      fontSize: 16,
      fontWeight: '600',
    },
    magnitudeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    magnitudeIcon: {
      marginRight: 4,
    },
    magnitudeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    metricItem: {
      flex: 1,
    },
    metricHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    metricIcon: {
      marginRight: 6,
    },
    metricLabel: {
      fontSize: 12,
      opacity: 0.6,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    timestampRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeIcon: {
      marginRight: 6,
    },
    timestampText: {
      fontSize: 12,
      opacity: 0.6,
    },
    chartPlaceholder: {
      marginTop: 20,
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    chartIcon: {
      marginRight: 8,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    chartArea: {
      height: 200,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chartPlaceholderIcon: {
      marginBottom: 12,
    },
    chartPlaceholderText: {
      fontSize: 14,
      opacity: 0.6,
      textAlign: 'center',
    },
  });

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
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons 
              name="pulse" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">Seismic Vibration</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Real-time vibration monitoring and analysis
          </ThemedText>
        </ThemedView>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {vibrationData.map((item) => (
            <ThemedView key={item.id} style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={styles.sensorRow}>
                  <Ionicons 
                    name="hardware-chip-outline" 
                    size={16} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    style={styles.sensorIcon}
                  />
                  <ThemedText style={styles.sensorText}>{item.location}</ThemedText>
                </View>
                <View style={[styles.magnitudeBadge, { backgroundColor: getMagnitudeColor(item.magnitude) + '20' }]}>
                  <Ionicons 
                    name={item.magnitude >= 3.0 ? 'warning' : item.magnitude >= 2.0 ? 'alert-circle' : 'checkmark-circle'} 
                    size={12} 
                    color={getMagnitudeColor(item.magnitude)}
                    style={styles.magnitudeIcon}
                  />
                  <ThemedText style={[styles.magnitudeText, { color: getMagnitudeColor(item.magnitude) }]}>
                    {getMagnitudeLevel(item.magnitude)}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Ionicons 
                      name="trending-up" 
                      size={14} 
                      color={getMagnitudeColor(item.magnitude)}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>Magnitude</ThemedText>
                  </View>
                  <ThemedText style={[styles.metricValue, { color: getMagnitudeColor(item.magnitude) }]}>
                    {item.magnitude}
                  </ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Ionicons 
                      name="speedometer" 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>Frequency</ThemedText>
                  </View>
                  <ThemedText style={styles.metricValue}>{item.frequency}</ThemedText>
                </View>
              </View>
              
              <View style={styles.timestampRow}>
                <Ionicons 
                  name="time-outline" 
                  size={14} 
                  color={Colors[colorScheme ?? 'light'].tabIconDefault}
                  style={styles.timeIcon}
                />
                <ThemedText style={styles.timestampText}>{item.timestamp}</ThemedText>
              </View>
            </ThemedView>
          ))}
          
          <ThemedView style={styles.chartPlaceholder}>
            <View style={styles.chartHeader}>
              <Ionicons 
                name="bar-chart" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.chartIcon}
              />
              <ThemedText style={styles.chartTitle}>Vibration Chart</ThemedText>
            </View>
            <View style={[styles.chartArea, { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10' }]}>
              <Ionicons 
                name="pulse-outline" 
                size={40} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
                style={styles.chartPlaceholderIcon}
              />
              <ThemedText style={styles.chartPlaceholderText}>
                Real-time vibration waveform will be displayed here
              </ThemedText>
            </View>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

