import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, db, doc, getDocs, query, updateDoc, uploadImageToStorage, where } from '../../firebase';

const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  totalResidents: number;
  paidResidents: number;
  unpaidResidents: number;
  pendingPayments: number;
  totalWaterConsumption: number; // in cubic meters
  totalWaterRate: number; // in pesos
  totalRevenue: number; // Total amount collected
  totalDue: number; // Total amount outstanding
  collectionRate: number; // Percentage of payments collected
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
    pendingPayments: 0,
    totalWaterConsumption: 0,
    totalWaterRate: 0,
    totalRevenue: 0,
    totalDue: 0,
    collectionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [residentBills, setResidentBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'other' | null>(null);
  const [otherMethod, setOtherMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  
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
      // Fetch resident users
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'resident'),
        where('isArchived', '==', false)
      );

      const querySnapshot = await getDocs(q);
      let totalResidents = querySnapshot.size;

      // Fetch all billing data
      const billingRef = collection(db, 'billing');
      const billingSnapshot = await getDocs(billingRef);

      let paidCount = 0;
      let unpaidCount = 0;
      let pendingCount = 0;
      let totalConsumption = 0;
      let totalRevenue = 0;
      let totalDue = 0;

      billingSnapshot.forEach((doc) => {
        const data = doc.data();
        const consumption = data.consumption || 0;
        const amount = data.totalAmount || 0;

        totalConsumption += consumption;

        if (data.status === 'paid') {
          paidCount++;
          totalRevenue += amount;
        } else if (data.status === 'pending') {
          pendingCount++;
          totalDue += amount;
        } else if (data.status === 'unpaid') {
          unpaidCount++;
          totalDue += amount;
        }
      });

      const totalBills = paidCount + unpaidCount + pendingCount;
      const collectionRate = totalBills > 0 ? (paidCount / totalBills) * 100 : 0;

      setStats({
        totalResidents: totalResidents,
        paidResidents: paidCount,
        unpaidResidents: unpaidCount,
        pendingPayments: pendingCount,
        totalWaterConsumption: totalConsumption,
        totalWaterRate: totalConsumption * WATER_RATE_PER_CUBIC_METER,
        totalRevenue: totalRevenue,
        totalDue: totalDue,
        collectionRate: collectionRate,
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

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentMethod(null);
    setOtherMethod('');
    setPaymentProof(null);
    setPaymentModalVisible(true);
  };

  const handleSelectPaymentMethod = (method: 'cash' | 'gcash' | 'other') => {
    setPaymentMethod(method);
    if (method !== 'other') {
      setOtherMethod('');
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos to upload payment proof.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPaymentProof(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedBill) return;

    // Validate payment method
    if (!paymentMethod) {
      Alert.alert('Validation Error', 'Please select a payment method');
      return;
    }

    if (paymentMethod === 'other' && !otherMethod.trim()) {
      Alert.alert('Validation Error', 'Please specify the payment method');
      return;
    }

    if (!paymentProof) {
      Alert.alert('Validation Error', 'Please upload payment proof');
      return;
    }

    setSubmittingPayment(true);

    try {
      const finalPaymentMethod = paymentMethod === 'other' ? otherMethod : paymentMethod;

      // Upload payment proof to Firebase Storage
      const fileName = `payment-proofs/${userId}_${selectedBill.id}_${Date.now()}.jpg`;
      const paymentProofURL = await uploadImageToStorage(paymentProof, fileName);

      // Prepare payment data with the Firebase Storage URL
      const paymentData = {
        userId: userId || '',
        userEmail: user?.email || '',
        userName: user?.name || '',
        billId: selectedBill.id,
        billMonth: selectedBill.month,
        billAmount: selectedBill.totalAmount,
        paymentMethod: finalPaymentMethod,
        paymentProof: paymentProofURL, // Use Firebase Storage download URL
        status: 'pending', // Pending admin approval
        createdAt: new Date().toISOString(),
      };

      // Save to payment history
      const paymentsRef = collection(db, 'payments');
      const paymentDocRef = await addDoc(paymentsRef, paymentData);

      // Create notification
      const notificationData = {
        userId: userId || '',
        userEmail: user?.email || '',
        userName: user?.name || '',
        type: 'payment_submitted',
        title: 'Payment Submitted',
        message: `Payment of ₱${selectedBill.totalAmount.toFixed(2)} for ${selectedBill.month} has been submitted via ${finalPaymentMethod}`,
        paymentId: paymentDocRef.id,
        billId: selectedBill.id,
        paymentProof: paymentProofURL,
        status: 'unread',
        createdAt: new Date().toISOString(),
      };

      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, notificationData);

      // Update bill status to pending (or keep as unpaid until admin approves)
      const billRef = doc(db, 'billing', selectedBill.id);
      await updateDoc(billRef, {
        status: 'pending', // Change to pending instead of paid
        paymentMethod: finalPaymentMethod,
        paymentProof: paymentProofURL,
        updatedAt: new Date().toISOString(),
      });

      // Refresh bills
      await fetchResidentBills();

      // Close modal and reset
      setPaymentModalVisible(false);
      setSelectedBill(null);
      setPaymentMethod(null);
      setOtherMethod('');
      setPaymentProof(null);

      Alert.alert(
        'Success',
        'Payment submitted successfully! Your payment is pending admin approval.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting payment:', error);
      Alert.alert('Error', 'Failed to submit payment. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCancelPayment = () => {
    setPaymentModalVisible(false);
    setSelectedBill(null);
    setPaymentMethod(null);
    setOtherMethod('');
    setPaymentProof(null);
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
    topMetricsContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 12,
    },
    metricCardLarge: {
      flex: 1,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    metricHeader: {
      marginBottom: 12,
    },
    metricIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
      marginBottom: 8,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    metricSubtext: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
    },
    collectionRateCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    collectionRateContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    collectionRateIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    collectionRateInfo: {
      flex: 1,
    },
    collectionRateLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    collectionRateValue: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    collectionRateSubtext: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
      textAlign: 'center',
    },
    quickActionsContainer: {
      marginTop: 8,
      marginBottom: 20,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    quickActionText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      textAlign: 'center',
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
    // Payment Modal Styles
    paymentModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    paymentModalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: 20,
    },
    paymentModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    paymentModalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    closeButton: {
      padding: 4,
    },
    paymentModalBody: {
      padding: 20,
    },
    paymentBillInfo: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      alignItems: 'center',
    },
    paymentBillMonth: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
    },
    paymentBillAmount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    paymentMethodSection: {
      marginBottom: 24,
    },
    paymentSectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 12,
    },
    paymentMethodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    paymentMethodSelected: {
      borderColor: Colors[colorScheme ?? 'light'].primary,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
    },
    paymentMethodText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      marginLeft: 12,
      fontWeight: '500',
    },
    paymentMethodTextSelected: {
      color: Colors[colorScheme ?? 'light'].primary,
      fontWeight: '600',
    },
    otherMethodInput: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 12,
      padding: 14,
      marginTop: 12,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    paymentProofSection: {
      marginBottom: 20,
    },
    uploadProofButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
    },
    uploadProofText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].primary,
      marginTop: 12,
    },
    uploadProofSubtext: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 4,
    },
    paymentProofContainer: {
      alignItems: 'center',
    },
    paymentProofImage: {
      width: '100%',
      height: 300,
      borderRadius: 12,
      marginBottom: 12,
      resizeMode: 'contain',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
    },
    changeProofButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    changeProofText: {
      marginLeft: 8,
      color: Colors[colorScheme ?? 'light'].primary,
      fontWeight: '600',
      fontSize: 14,
    },
    paymentModalFooter: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme ?? 'light'].border,
    },
    paymentCancelButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    paymentCancelText: {
      color: Colors[colorScheme ?? 'light'].text,
      fontSize: 16,
      fontWeight: '600',
    },
    paymentButtonSpacing: {
      width: 12,
    },
    paymentSubmitButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    paymentSubmitText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    disabledButton: {
      opacity: 0.6,
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

        {/* Payment Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={paymentModalVisible}
          onRequestClose={handleCancelPayment}
        >
          <Pressable
            style={styles.paymentModalOverlay}
            onPress={handleCancelPayment}
          >
            <View style={styles.paymentModalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.paymentModalHeader}>
                <Text style={styles.paymentModalTitle}>Submit Payment</Text>
                <TouchableOpacity
                  onPress={handleCancelPayment}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors[colorScheme ?? 'light'].text}
                  />
                </TouchableOpacity>
              </View>

              {selectedBill && (
                <ScrollView style={styles.paymentModalBody}>
                  <View style={styles.paymentBillInfo}>
                    <Text style={styles.paymentBillMonth}>{selectedBill.month}</Text>
                    <Text style={styles.paymentBillAmount}>₱{selectedBill.totalAmount.toFixed(2)}</Text>
                  </View>

                  {/* Payment Method Selection */}
                  <View style={styles.paymentMethodSection}>
                    <Text style={styles.paymentSectionLabel}>Payment Method</Text>
                    <TouchableOpacity
                      style={[
                        styles.paymentMethodOption,
                        paymentMethod === 'cash' && styles.paymentMethodSelected
                      ]}
                      onPress={() => handleSelectPaymentMethod('cash')}
                    >
                      <Ionicons
                        name={paymentMethod === 'cash' ? 'radio-button-on' : 'radio-button-off'}
                        size={24}
                        color={paymentMethod === 'cash' ? Colors[colorScheme ?? 'light'].primary : Colors[colorScheme ?? 'light'].tabIconDefault}
                      />
                      <Text style={[
                        styles.paymentMethodText,
                        paymentMethod === 'cash' && styles.paymentMethodTextSelected
                      ]}>Cash</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentMethodOption,
                        paymentMethod === 'gcash' && styles.paymentMethodSelected
                      ]}
                      onPress={() => handleSelectPaymentMethod('gcash')}
                    >
                      <Ionicons
                        name={paymentMethod === 'gcash' ? 'radio-button-on' : 'radio-button-off'}
                        size={24}
                        color={paymentMethod === 'gcash' ? Colors[colorScheme ?? 'light'].primary : Colors[colorScheme ?? 'light'].tabIconDefault}
                      />
                      <Text style={[
                        styles.paymentMethodText,
                        paymentMethod === 'gcash' && styles.paymentMethodTextSelected
                      ]}>GCash</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentMethodOption,
                        paymentMethod === 'other' && styles.paymentMethodSelected
                      ]}
                      onPress={() => handleSelectPaymentMethod('other')}
                    >
                      <Ionicons
                        name={paymentMethod === 'other' ? 'radio-button-on' : 'radio-button-off'}
                        size={24}
                        color={paymentMethod === 'other' ? Colors[colorScheme ?? 'light'].primary : Colors[colorScheme ?? 'light'].tabIconDefault}
                      />
                      <Text style={[
                        styles.paymentMethodText,
                        paymentMethod === 'other' && styles.paymentMethodTextSelected
                      ]}>Other</Text>
                    </TouchableOpacity>

                    {paymentMethod === 'other' && (
                      <TextInput
                        style={styles.otherMethodInput}
                        placeholder="Specify payment method"
                        placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                        value={otherMethod}
                        onChangeText={setOtherMethod}
                      />
                    )}
                  </View>

                  {/* Payment Proof Upload */}
                  <View style={styles.paymentProofSection}>
                    <Text style={styles.paymentSectionLabel}>Payment Proof</Text>
                    {paymentProof ? (
                      <View style={styles.paymentProofContainer}>
                        <Image
                          source={{ uri: paymentProof }}
                          style={styles.paymentProofImage}
                        />
                        <TouchableOpacity
                          style={styles.changeProofButton}
                          onPress={handlePickImage}
                        >
                          <Ionicons
                            name="refresh"
                            size={20}
                            color={Colors[colorScheme ?? 'light'].primary}
                          />
                          <Text style={styles.changeProofText}>Change Image</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadProofButton}
                        onPress={handlePickImage}
                      >
                        <Ionicons
                          name="image-outline"
                          size={32}
                          color={Colors[colorScheme ?? 'light'].primary}
                        />
                        <Text style={styles.uploadProofText}>Upload Payment Proof</Text>
                        <Text style={styles.uploadProofSubtext}>Tap to select an image</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              )}

              <View style={styles.paymentModalFooter}>
                <TouchableOpacity
                  style={[styles.paymentCancelButton, submittingPayment && styles.disabledButton]}
                  onPress={handleCancelPayment}
                  disabled={submittingPayment}
                >
                  <Text style={styles.paymentCancelText}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.paymentButtonSpacing} />
                <TouchableOpacity
                  style={[styles.paymentSubmitButton, submittingPayment && styles.disabledButton]}
                  onPress={handleSubmitPayment}
                  disabled={submittingPayment}
                >
                  {submittingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.paymentSubmitText}>Submit</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors[colorScheme ?? 'light'].primary]}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            {getGreeting()}! 👋
          </Text>
          <Text style={styles.greetingName}>{userName}</Text>
        </View>

        {/* Key Metrics - Top Cards */}
        <View style={styles.topMetricsContainer}>
          {/* Total Revenue Card */}
          <View style={[styles.metricCardLarge, { backgroundColor: '#D1FAE5' }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#059669' }]}>
                <Ionicons name="cash" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <Text style={[styles.metricValue, { color: '#059669' }]}>
              ₱{stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.metricSubtext}>Collected payments</Text>
          </View>

          {/* Total Due Card */}
          <View style={[styles.metricCardLarge, { backgroundColor: '#FEE2E2' }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#DC2626' }]}>
                <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.metricLabel}>Amount Due</Text>
            <Text style={[styles.metricValue, { color: '#DC2626' }]}>
              ₱{stats.totalDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.metricSubtext}>Outstanding balance</Text>
          </View>
        </View>

        {/* Collection Rate Card */}
        <View style={[styles.collectionRateCard, { 
          backgroundColor: stats.collectionRate >= 75 ? '#D1FAE5' : stats.collectionRate >= 50 ? '#FEF3C7' : '#FEE2E2'
        }]}>
          <View style={styles.collectionRateContent}>
            <View style={[styles.collectionRateIcon, { 
              backgroundColor: stats.collectionRate >= 75 ? '#059669' : stats.collectionRate >= 50 ? '#F59E0B' : '#DC2626'
            }]}>
              <Ionicons 
                name={stats.collectionRate >= 75 ? "checkmark-circle" : stats.collectionRate >= 50 ? "time" : "warning"} 
                size={32} 
                color="#FFFFFF" 
              />
            </View>
            <View style={styles.collectionRateInfo}>
              <Text style={styles.collectionRateLabel}>Collection Rate</Text>
              <Text style={[styles.collectionRateValue, { 
                color: stats.collectionRate >= 75 ? '#059669' : stats.collectionRate >= 50 ? '#F59E0B' : '#DC2626'
              }]}>
                {stats.collectionRate.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.collectionRateSubtext}>
            {stats.paidResidents} of {stats.paidResidents + stats.unpaidResidents + stats.pendingPayments} bills paid
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="people" size={18} color="#1976D2" />
                </View>
              </View>
              <Text style={styles.statLabel}>Residents</Text>
              <Text style={styles.statValue}>{stats.totalResidents}</Text>
              <Text style={styles.statSubtext}>Active users</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-done" size={18} color="#388E3C" />
                </View>
              </View>
              <Text style={styles.statLabel}>Paid Bills</Text>
              <Text style={[styles.statValue, { color: '#388E3C' }]}>{stats.paidResidents}</Text>
              <Text style={styles.statSubtext}>Completed</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="hourglass" size={18} color="#F57C00" />
                </View>
              </View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#F57C00' }]}>{stats.pendingPayments}</Text>
              <Text style={styles.statSubtext}>Awaiting approval</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="close-circle" size={18} color="#D32F2F" />
                </View>
              </View>
              <Text style={styles.statLabel}>Unpaid</Text>
              <Text style={[styles.statValue, { color: '#D32F2F' }]}>{stats.unpaidResidents}</Text>
              <Text style={styles.statSubtext}>Overdue bills</Text>
            </View>

            <View style={[styles.statCard, styles.statCardFull]}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#E0F7FA' }]}>
                  <Ionicons name="water" size={18} color={Colors[colorScheme ?? 'light'].primary} />
                </View>
              </View>
              <Text style={styles.statLabel}>Water Consumption</Text>
              <Text style={styles.statValue}>{stats.totalWaterConsumption.toFixed(2)} m³</Text>
              <Text style={styles.statSubtext}>Total usage this period</Text>
            </View>
          </View>
        </View>

        {/* Charts Section */}
        {(stats.paidResidents + stats.unpaidResidents + stats.pendingPayments) > 0 && (
          <View style={styles.chartsContainer}>
            <Text style={styles.chartsTitle}>Payment Analytics</Text>
            
            {/* Pie Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartLabel}>Bill Status Distribution</Text>
              <PieChart
                data={[
                  {
                    name: 'Paid',
                    population: stats.paidResidents,
                    color: '#059669',
                    legendFontColor: '#1F2937',
                    legendFontSize: 13,
                  },
                  {
                    name: 'Pending',
                    population: stats.pendingPayments,
                    color: '#F59E0B',
                    legendFontColor: '#1F2937',
                    legendFontSize: 13,
                  },
                  {
                    name: 'Unpaid',
                    population: stats.unpaidResidents,
                    color: '#DC2626',
                    legendFontColor: '#1F2937',
                    legendFontSize: 13,
                  },
                ]}
                width={screenWidth - 64}
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
              <Text style={styles.chartLabel}>Payment Status Comparison</Text>
              <BarChart
                data={{
                  labels: ['Paid', 'Pending', 'Unpaid'],
                  datasets: [
                    {
                      data: [
                        stats.paidResidents || 0.1, 
                        stats.pendingPayments || 0.1, 
                        stats.unpaidResidents || 0.1
                      ],
                      colors: [
                        () => '#059669',
                        () => '#F59E0B',
                        () => '#DC2626',
                      ],
                    },
                  ],
                }}
                width={screenWidth - 64}
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
                  barPercentage: 0.5,
                }}
                withCustomBarColorFromData
                flatColor
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

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.statsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/users')}
            >
              <Ionicons name="people-outline" size={28} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={styles.quickActionText}>View Users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/payment-history')}
            >
              <Ionicons name="document-text-outline" size={28} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={styles.quickActionText}>Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <Ionicons name="notifications-outline" size={28} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={styles.quickActionText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh-outline" size={28} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={styles.quickActionText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
