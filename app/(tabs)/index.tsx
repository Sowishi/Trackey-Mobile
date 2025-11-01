import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, db, doc, getDocs, query, updateDoc, where } from '../../firebase';

const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  totalResidents: number;
  paidResidents: number;
  unpaidResidents: number;
  totalWaterConsumption: number; // in cubic meters
  totalWaterRate: number; // in pesos
}

interface Bill {
  id: string;
  month: string;
  coverageDateFrom: string;
  coverageDateTo: string;
  dueDate: string;
  consumption: number;
  totalAmount: number;
  status: string;
  createdAt: string;
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
  const [residentBills, setResidentBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const WATER_RATE_PER_CUBIC_METER = 20; // 20 pesos per cubic meter

  // Check if user is resident
  const isResident = user?.position?.toLowerCase() === 'resident' || user?.position?.toLowerCase() === 'residents';

  // Fetch user ID from users collection
  const fetchUserId = async () => {
    if (!user?.email) return;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setUserId(userDoc.id);
        return userDoc.id;
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
    return null;
  };

  // Fetch resident bills
  const fetchResidentBills = async () => {
    if (!user?.email) return;
    
    setLoadingBills(true);
    try {
      const currentUserId = userId || await fetchUserId();
      if (!currentUserId) {
        setLoadingBills(false);
        return;
      }

      const billingRef = collection(db, 'billing');
      const q = query(billingRef, where('userId', '==', currentUserId));
      const querySnapshot = await getDocs(q);

      const bills: Bill[] = [];
      querySnapshot.forEach((doc) => {
        bills.push({
          id: doc.id,
          ...doc.data(),
        } as Bill);
      });

      // Sort by month and creation date (newest first)
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      bills.sort((a, b) => {
        const monthOrder = months.indexOf(a.month) - months.indexOf(b.month);
        if (monthOrder !== 0) return monthOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setResidentBills(bills);
    } catch (error) {
      console.error('Error fetching resident bills:', error);
    } finally {
      setLoadingBills(false);
    }
  };

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
    if (isResident) {
      fetchUserId().then(() => {
        fetchResidentBills();
      });
    } else {
      fetchDashboardStats();
    }
  }, [user]);

  useEffect(() => {
    if (isResident && userId) {
      fetchResidentBills();
    }
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (isResident) {
      fetchResidentBills().finally(() => setRefreshing(false));
    } else {
      fetchDashboardStats().finally(() => setRefreshing(false));
    }
  };

  const handleViewReceipt = (bill: Bill) => {
    router.push({
      pathname: '/(tabs)/receipt',
      params: {
        billData: JSON.stringify({
          ...bill,
          userId: userId || '',
          userEmail: user?.email || '',
          userName: user?.name || '',
          waterRatePerCubicMeter: WATER_RATE_PER_CUBIC_METER,
        }),
      },
    });
  };

  const handlePayBill = async (bill: Bill) => {
    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to mark the bill for ${bill.month} (₱${bill.totalAmount.toFixed(2)}) as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              const billRef = doc(db, 'billing', bill.id);
              await updateDoc(billRef, {
                status: 'paid',
                updatedAt: new Date().toISOString(),
              });

              // Also update user payment status if all bills are paid
              await fetchResidentBills();
              
              Alert.alert('Success', 'Bill marked as paid successfully!');
            } catch (error) {
              console.error('Error updating bill:', error);
              Alert.alert('Error', 'Failed to update bill status. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderBillCard = ({ item }: { item: Bill }) => {
    return (
      <View style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={styles.billMonth}>{item.month}</Text>
            <Text style={styles.billDate}>
              Due: {formatDate(item.dueDate)}
            </Text>
          </View>
          <View style={[
            styles.billStatusBadge,
            item.status === 'paid' ? styles.billStatusPaid : styles.billStatusUnpaid
          ]}>
            <Text style={styles.billStatusText}>
              {item.status === 'paid' ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        </View>
        <View style={styles.billDetails}>
          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Consumption:</Text>
            <Text style={styles.billDetailValue}>{item.consumption} m³</Text>
          </View>
          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Amount:</Text>
            <Text style={styles.billAmount}>₱{item.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.billActions}>
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => handleViewReceipt(item)}
          >
            <Ionicons name="receipt" size={18} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={styles.receiptButtonText}>View Receipt</Text>
          </TouchableOpacity>
          {item.status === 'unpaid' && (
            <>
              <View style={styles.billActionSpacing} />
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => handlePayBill(item)}
              >
                <Ionicons name="card" size={18} color="#FFFFFF" />
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = user?.name || 'User';

  // Calculate resident stats
  const totalBills = residentBills.length;
  const paidBills = residentBills.filter(bill => bill.status === 'paid').length;
  const unpaidBills = residentBills.filter(bill => bill.status === 'unpaid').length;
  const totalAmountDue = residentBills
    .filter(bill => bill.status === 'unpaid')
    .reduce((sum, bill) => sum + bill.totalAmount, 0);

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
    // Resident Dashboard Styles
    residentContent: {
      padding: 20,
      paddingBottom: 100,
    },
    residentHeader: {
      marginBottom: 20,
    },
    residentStats: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    residentStatCardSpacing: {
      width: 12,
    },
    residentStatCard: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      alignItems: 'center',
    },
    residentStatHeader: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    residentStatLabel: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginBottom: 4,
    },
    residentStatValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    amountDueCard: {
      backgroundColor: '#FEE2E2',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    amountDueLabel: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
      fontWeight: '600',
    },
    amountDueValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    billsTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginTop: 8,
      marginBottom: 16,
    },
    billCard: {
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
    },
    billHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    billInfo: {
      flex: 1,
    },
    billMonth: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    billDate: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    billStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    billStatusPaid: {
      backgroundColor: '#D1FAE5',
    },
    billStatusUnpaid: {
      backgroundColor: '#FEE2E2',
    },
    billStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    billDetails: {
      marginBottom: 16,
    },
    billDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    billDetailLabel: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    billDetailValue: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '600',
    },
    billAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    billActions: {
      flexDirection: 'row',
      marginTop: 12,
    },
    billActionSpacing: {
      width: 12,
    },
    receiptButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    receiptButtonText: {
      marginLeft: 8,
      color: Colors[colorScheme ?? 'light'].primary,
      fontWeight: '600',
      fontSize: 14,
    },
    payButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    payButtonText: {
      marginLeft: 8,
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 8,
      textAlign: 'center',
    },
  });

  if (isResident && loadingBills) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="My Bills" 
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading your bills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isResident && loading) {
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

  // Resident Dashboard View
  if (isResident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="My Bills" 
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <FlatList
          data={residentBills}
          renderItem={renderBillCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.residentContent}
          ListHeaderComponent={() => (
            <View style={styles.residentHeader}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.greetingName}>{userName}</Text>
              </View>

              {/* Resident Stats */}
              <View style={styles.residentStats}>
                <View style={styles.residentStatCard}>
                  <View style={styles.residentStatHeader}>
                    <Ionicons
                      name="document-text"
                      size={20}
                      color={Colors[colorScheme ?? 'light'].primary}
                    />
                  </View>
                  <Text style={styles.residentStatLabel}>Total Bills</Text>
                  <Text style={styles.residentStatValue}>{totalBills}</Text>
                </View>
                <View style={styles.residentStatCardSpacing} />
                <View style={styles.residentStatCard}>
                  <View style={[styles.residentStatHeader, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors[colorScheme ?? 'light'].primary}
                    />
                  </View>
                  <Text style={styles.residentStatLabel}>Paid</Text>
                  <Text style={styles.residentStatValue}>{paidBills}</Text>
                </View>
                <View style={styles.residentStatCardSpacing} />
                <View style={styles.residentStatCard}>
                  <View style={[styles.residentStatHeader, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={Colors[colorScheme ?? 'light'].primary}
                    />
                  </View>
                  <Text style={styles.residentStatLabel}>Unpaid</Text>
                  <Text style={styles.residentStatValue}>{unpaidBills}</Text>
                </View>
              </View>

              {totalAmountDue > 0 && (
                <View style={styles.amountDueCard}>
                  <Text style={styles.amountDueLabel}>Total Amount Due</Text>
                  <Text style={styles.amountDueValue}>₱{totalAmountDue.toFixed(2)}</Text>
                </View>
              )}

              <Text style={styles.billsTitle}>My Bills</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={80}
                color={Colors[colorScheme ?? 'light'].icon}
              />
              <Text style={styles.emptyText}>No bills found</Text>
              <Text style={styles.emptySubtext}>Your billing records will appear here</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors[colorScheme ?? 'light'].primary]}
            />
          }
        />
      </SafeAreaView>
    );
  }

  // Admin Dashboard View
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
