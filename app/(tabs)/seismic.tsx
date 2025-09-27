import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database, off, onValue, ref } from '../../firebase';

const { width } = Dimensions.get('window');

interface SeismicData {
  value: number;
  timestamp: string;
}

export default function SeismicVibrationScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<'VCS1' | 'VCS2'>('VCS1');
  const [vcs1FirebaseData, setVcs1FirebaseData] = useState<SeismicData[]>([]);
  const [vcs2FirebaseData, setVcs2FirebaseData] = useState<SeismicData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Set up Firebase realtime database listeners
    const vcs1Ref = ref(database, 'BNHS-Struxis/seismic/vcs1/values');
    const vcs2Ref = ref(database, 'BNHS-Struxis/seismic/vcs2/values');

    const vcs1Listener = onValue(vcs1Ref, (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: SeismicData[] = Object.keys(data).map(key => ({
          value: data[key].value || 0,
          timestamp: data[key].timestamp || new Date().toISOString(),
        })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        setVcs1FirebaseData(formattedData);
        console.log('VCS1 Firebase data updated:', formattedData.length, 'records');
      }
      setIsLoading(false);
    });

    const vcs2Listener = onValue(vcs2Ref, (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: SeismicData[] = Object.keys(data).map(key => ({
          value: data[key].value || 0,
          timestamp: data[key].timestamp || new Date().toISOString(),
        })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        setVcs2FirebaseData(formattedData);
        console.log('VCS2 Firebase data updated:', formattedData.length, 'records');
      }
    });

    // Cleanup listeners on unmount
    return () => {
      off(vcs1Ref, 'value', vcs1Listener);
      off(vcs2Ref, 'value', vcs2Listener);
    };
  }, []);

  // Helper function to format timestamp for chart labels
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  // Format timestamp for shorter chart labels
  const formatChartLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Filter data by selected date
  const filterDataByDate = (data: SeismicData[]) => {
    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return isSameDay(itemDate, selectedDate);
    });
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    setSelectedDate(previousDay);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    if (nextDay <= new Date()) { // Don't allow future dates
      setSelectedDate(nextDay);
    }
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Format date for display
  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Prepare chart data from Firebase data
  const getChartData = (data: SeismicData[]) => {
    if (data.length === 0) {
      // Fallback data when no Firebase data is available
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
          strokeWidth: 2,
        }],
      };
    }

    // Take last 8 data points for better chart readability with bigger size
    const recentData = data.slice(-8);
    
    return {
      labels: recentData.map(item => formatChartLabel(item.timestamp)),
      datasets: [{
        data: recentData.map(item => item.value),
        color: (opacity = 1) => activeTab === 'VCS1' 
          ? `rgba(255, 68, 68, ${opacity})` 
          : `rgba(68, 133, 244, ${opacity})`,
        strokeWidth: 3,
      }],
    };
  };

  // Get current data based on active tab with date filtering
  const filteredVcs1Data = filterDataByDate(vcs1FirebaseData);
  const filteredVcs2Data = filterDataByDate(vcs2FirebaseData);
  const vcs1Data = getChartData(filteredVcs1Data);
  const vcs2Data = getChartData(filteredVcs2Data);

  const chartConfig = {
    backgroundColor: Colors[colorScheme ?? 'light'].background,
    backgroundGradientFrom: Colors[colorScheme ?? 'light'].background,
    backgroundGradientTo: Colors[colorScheme ?? 'light'].background,
    decimalPlaces: 1,
    color: (opacity = 1) => Colors[colorScheme ?? 'light'].text + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => Colors[colorScheme ?? 'light'].text + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors[colorScheme ?? 'light'].background,
    },
    propsForLabels: {
      fontSize: 12,
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
    },
  };

  const getCurrentData = () => {
    return activeTab === 'VCS1' ? vcs1Data : vcs2Data;
  };

  const getCurrentStats = () => {
    const firebaseData = activeTab === 'VCS1' ? filteredVcs1Data : filteredVcs2Data;
    
    if (firebaseData.length === 0) {
      return {
        current: '0.0',
        max: '0.0',
        min: '0.0',
        avg: '0.0',
        trend: 'same' as const,
        lastUpdate: 'No data',
      };
    }

    const values = firebaseData.map(item => item.value);
    const current = values[values.length - 1];
    const previous = values.length > 1 ? values[values.length - 2] : current;
    const trend = current > previous ? 'up' : current < previous ? 'down' : 'same';
    const lastTimestamp = firebaseData[firebaseData.length - 1]?.timestamp;
    
    return {
      current: current.toFixed(1),
      max: Math.max(...values).toFixed(1),
      min: Math.min(...values).toFixed(1),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      trend,
      lastUpdate: lastTimestamp ? formatTimestamp(lastTimestamp) : 'Unknown',
    };
  };

  const stats = getCurrentStats();

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors[colorScheme ?? 'light'].background,
    paddingBottom: 50,
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    alignItems: 'center',
    },
    activeTab: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
    },
    tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
    activeTabText: {
      color: 'white',
    },
    inactiveTabText: {
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    scrollView: {
    flex: 1,
  },
    chartContainer: {
      marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
      marginBottom: 16,
  },
  chartIcon: {
    marginRight: 8,
  },
  chartTitle: {
      fontSize: 20,
    fontWeight: '600',
  },
    chartWrapper: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    statsContainer: {
      marginTop: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: '48%',
      padding: 16,
    borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    statHeader: {
      flexDirection: 'row',
    alignItems: 'center',
      marginBottom: 8,
  },
    statIcon: {
      marginRight: 8,
  },
    statLabel: {
    fontSize: 14,
      opacity: 0.7,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    trendIcon: {
      marginLeft: 8,
    },
    lastUpdate: {
      fontSize: 14,
      opacity: 0.6,
      fontWeight: 'normal',
    },
    loadingContainer: {
      height: 300,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10',
      borderRadius: 16,
    },
    loadingText: {
      marginTop: 12,
      opacity: 0.6,
    },
    datePickerContainer: {
      marginBottom: 16,
    },
    dateNavigationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateNavButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
    },
    dateDisplayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].tint + '15',
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tint + '30',
      flex: 1,
      marginHorizontal: 12,
      justifyContent: 'center',
    },
    dateIcon: {
      marginRight: 8,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].tint,
    },
});

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
            {isLoading 
              ? 'Connecting to Firebase...' 
              : `${filteredVcs1Data.length + filteredVcs2Data.length} data points for selected date`
            }
          </ThemedText>
        </ThemedView>
        
        {/* Date Picker */}
        <View style={styles.datePickerContainer}>
          <View style={styles.dateNavigationContainer}>
            <TouchableOpacity 
              style={styles.dateNavButton}
              onPress={goToPreviousDay}
            >
              <Ionicons 
                name="chevron-back" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateDisplayButton}
              onPress={goToToday}
            >
              <Ionicons 
                name="calendar" 
                size={18} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.dateIcon}
              />
              <ThemedText style={styles.dateText}>
                {formatDisplayDate(selectedDate)}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.dateNavButton, { opacity: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) > new Date() ? 0.3 : 1 }]}
              onPress={goToNextDay}
              disabled={new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) > new Date()}
            >
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'VCS1' && styles.activeTab]}
            onPress={() => setActiveTab('VCS1')}
          >
            <ThemedText style={[
              styles.tabText,
              activeTab === 'VCS1' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              VCS1
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'VCS2' && styles.activeTab]}
            onPress={() => setActiveTab('VCS2')}
          >
            <ThemedText style={[
              styles.tabText,
              activeTab === 'VCS2' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              VCS2
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Chart Section */}
          <ThemedView style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Ionicons 
                name="analytics" 
                size={24} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.chartIcon}
              />
              <ThemedText style={styles.chartTitle}>
                {activeTab} Vibration Data
                {stats.lastUpdate !== 'No data' && (
                  <ThemedText style={styles.lastUpdate}> • Last: {stats.lastUpdate}</ThemedText>
                )}
              </ThemedText>
            </View>
            
            <View style={styles.chartWrapper}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons 
                    name="pulse-outline" 
                    size={40} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                  />
                  <ThemedText style={styles.loadingText}>Loading Firebase data...</ThemedText>
                </View>
              ) : (
                <LineChart
                  data={getCurrentData()}
                  width={width - 40}
                  height={300}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    borderRadius: 16,
                  }}
                />
              )}
            </View>
          </ThemedView>

          {/* Statistics */}
          <ThemedView style={styles.statsContainer}>
            <View style={styles.chartHeader}>
              <Ionicons 
                name="stats-chart" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.chartIcon}
              />
              <ThemedText style={[styles.chartTitle, { fontSize: 18 }]}>Statistics</ThemedText>
            </View>
            
            <View style={styles.statsGrid}>
              <ThemedView style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons 
                    name="radio-button-on" 
                    size={16} 
                    color={activeTab === 'VCS1' ? '#ff4444' : '#4485f4'}
                    style={styles.statIcon}
                  />
                  <ThemedText style={styles.statLabel}>Current</ThemedText>
                  <Ionicons 
                    name={stats.trend === 'up' ? 'trending-up' : stats.trend === 'down' ? 'trending-down' : 'remove'}
                    size={16} 
                    color={stats.trend === 'up' ? '#44ff44' : stats.trend === 'down' ? '#ff4444' : Colors[colorScheme ?? 'light'].tabIconDefault}
                    style={styles.trendIcon}
                  />
                </View>
                <ThemedText style={styles.statValue}>{stats.current}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons 
                    name="arrow-up" 
                    size={16} 
                    color="#ff4444"
                    style={styles.statIcon}
                  />
                  <ThemedText style={styles.statLabel}>Maximum</ThemedText>
                </View>
                <ThemedText style={[styles.statValue, { color: '#ff4444' }]}>{stats.max}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons 
                    name="arrow-down" 
                    size={16} 
                    color="#44ff44"
                    style={styles.statIcon}
                  />
                  <ThemedText style={styles.statLabel}>Minimum</ThemedText>
                </View>
                <ThemedText style={[styles.statValue, { color: '#44ff44' }]}>{stats.min}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons 
                    name="analytics" 
                    size={16} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    style={styles.statIcon}
                  />
                  <ThemedText style={styles.statLabel}>Average</ThemedText>
                </View>
                <ThemedText style={styles.statValue}>{stats.avg}</ThemedText>
              </ThemedView>
            </View>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

