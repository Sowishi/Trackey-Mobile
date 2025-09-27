import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OverloadCollectionScreen() {
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
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    locationIcon: {
      marginRight: 8,
    },
    locationText: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusIcon: {
      marginRight: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    loadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    loadIcon: {
      marginRight: 8,
    },
    loadText: {
      fontSize: 14,
      opacity: 0.8,
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
  });

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
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons 
              name="tray-full" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">Overload Collection</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Monitor structural load conditions across buildings
          </ThemedText>
        </ThemedView>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {sampleData.map((item) => (
            <ThemedView key={item.id} style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={styles.locationRow}>
                  <Ionicons 
                    name="business-outline" 
                    size={16} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    style={styles.locationIcon}
                  />
                  <ThemedText style={styles.locationText}>{item.location}</ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Ionicons 
                    name={item.status === 'Critical' ? 'warning' : item.status === 'Warning' ? 'alert-circle' : 'checkmark-circle'} 
                    size={12} 
                    color={getStatusColor(item.status)}
                    style={styles.statusIcon}
                  />
                  <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.loadRow}>
                <Ionicons 
                  name="speedometer-outline" 
                  size={16} 
                  color={Colors[colorScheme ?? 'light'].tabIconDefault}
                  style={styles.loadIcon}
                />
                <ThemedText style={styles.loadText}>Load: {item.load}</ThemedText>
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
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

