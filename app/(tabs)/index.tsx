import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, getDocs, query, where } from '../../firebase';

const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  totalResidents: number;
  paidResidents: number;
  unpaidResidents: number;
  totalWaterConsumption: number; // in cubic meters
  totalWaterRate: number; // in pesos
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalResidents: 0,
    paidResidents: 0,
    unpaidResidents: 0,
    totalWaterConsumption: 0,
    totalWaterRate: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const WATER_RATE_PER_CUBIC_METER = 20; // 20 pesos per cubic meter

  const fetchDashboardStats = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'resident'),
        where('isArchived', '==', false)
      );

      const querySnapshot = await getDocs(q);
      let total = 0;
      let paid = 0;
      let unpaid = 0;
      let totalConsumption = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.paymentStatus === 'paid') {
          paid++;
        } else {
          unpaid++;
        }
        
        // Calculate water consumption from meter reading or consumption field
        // Assuming waterConsumption field exists, or use meterNumber if it represents consumption
        const consumption = data.waterConsumption || 
                          data.waterReading || 
                          (data.meterNumber ? parseFloat(data.meterNumber) || 0 : 0);
        totalConsumption += consumption;
      });

      const totalWaterRate = totalConsumption * WATER_RATE_PER_CUBIC_METER;

      setStats({
        totalResidents: total,
        paidResidents: paid,
        unpaidResidents: unpaid,
        totalWaterConsumption: totalConsumption,
        totalWaterRate: totalWaterRate,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = user?.name || 'User';

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    paddingBottom: 80,
    },
    container: {
      flex: 1,
      paddingBottom: 80,
    },
    content: {
      padding: 20,
    },
    greetingContainer: {
      marginBottom: 24,
    },
    greetingText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
      marginBottom: 4,
    },
    greetingName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    statsContainer: {
      marginBottom: 24,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    statCardFull: {
      width: '100%',
      minWidth: '100%',
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    statLabel: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
      fontWeight: '500',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
      marginTop: 6,
    },
    statSubtext: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.5,
      marginTop: 4,
    },
    quickActionsTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
    },
    chartsContainer: {
      marginTop: 8,
    },
    chartsTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 16,
    },
    chartCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignItems: 'center',
    },
    chartLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 12,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Dashboard" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title="Dashboard" 
        onUserPress={() => router.push('/(tabs)/profile')}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            {getGreeting()}! 👋
          </Text>
          <Text style={styles.greetingName}>{userName}</Text>
        </View>

        {/* Charts Section */}
        {stats.totalResidents > 0 && (
          <View style={styles.chartsContainer}>
            <Text style={styles.chartsTitle}>Payment Overview</Text>
            
            {/* Pie Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartLabel}>Payment Distribution</Text>
              <PieChart
                data={[
                  {
                    name: 'Paid',
                    population: stats.paidResidents,
                    color: '#059669',
                    legendFontColor: '#1F2937',
                    legendFontSize: 14,
                  },
                  {
                    name: 'Unpaid',
                    population: stats.unpaidResidents,
                    color: '#DC2626',
                    legendFontColor: '#1F2937',
                    legendFontSize: 14,
                  },
                ]}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  color: (opacity) => `rgba(0, 119, 182, ${opacity})`,
                  labelColor: (opacity) => `rgba(31, 41, 55, ${opacity})`,
                  strokeWidth: 2,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>

            {/* Bar Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartLabel}>Payment Comparison</Text>
              <BarChart
                data={{
                  labels: ['Paid', 'Unpaid'],
                  datasets: [
                    {
                      data: [stats.paidResidents, stats.unpaidResidents],
                    },
                  ],
                }}
                width={screenWidth - 80}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity) => `rgba(0, 119, 182, ${opacity})`,
                  labelColor: (opacity) => `rgba(31, 41, 55, ${opacity})`,
                  fillShadowGradient: '#0077b6',
                  fillShadowGradientOpacity: 1,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.6,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                fromZero
                showValuesOnTopOfBars
              />
            </View>
          </View>
        )}

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="people"
                    size={16}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
              </View>
              <Text style={styles.statLabel}>Total Residents</Text>
              <Text style={styles.statValue}>{stats.totalResidents}</Text>
            </View>

            <View style={[styles.statCard, styles.statCardFull]}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#E0F7FA' }]}>
                  <Ionicons
                    name="water"
                    size={16}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
              </View>
              <Text style={styles.statLabel}>Water Rate</Text>
              <Text style={styles.statValue}>
              ₱{WATER_RATE_PER_CUBIC_METER.toFixed(2)} per m³
              </Text>
            </View>

          
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
