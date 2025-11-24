import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, doc, getDoc, getDocs, query, where } from '../../firebase';

interface Bill {
  id: string;
  month: string;
  coverageDateFrom: string;
  coverageDateTo: string;
  dueDate: string;
  previousConsumption?: number;
  consumption: number;
  consumptionUsed?: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  accountNumber?: string;
}

export default function BillingInformationScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const showUnpaidOnly = params.showUnpaidOnly === 'true';
  const [residentBills, setResidentBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const WATER_RATE_PER_CUBIC_METER = 20; // 20 pesos per cubic meter (fallback)

  // Fetch user ID from users collection
  const fetchUserId = async () => {
    if (!user?.email) return null;
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

  // Fetch all unpaid bills with user information
  const fetchAllUnpaidBills = async () => {
    setLoadingBills(true);
    try {
      const billingRef = collection(db, 'billing');
      const unpaidQuery = query(
        billingRef,
        where('status', '==', 'unpaid')
      );
      const unpaidSnapshot = await getDocs(unpaidQuery);

      const billsWithUsers: Bill[] = [];
      
      // Fetch user information for each bill
      for (const billDoc of unpaidSnapshot.docs) {
        const billData = billDoc.data();
        try {
          const userDocRef = doc(db, 'users', billData.userId);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            billsWithUsers.push({
              id: billDoc.id,
              ...billData,
              userName: userData.fullName || userData.name || '',
              userEmail: userData.email || '',
              accountNumber: userData.accountNumber || '',
            } as Bill);
          } else {
            billsWithUsers.push({
              id: billDoc.id,
              ...billData,
              userName: 'Unknown User',
              userEmail: '',
              accountNumber: '',
            } as Bill);
          }
        } catch (error) {
          console.error(`Error fetching user for bill ${billDoc.id}:`, error);
          billsWithUsers.push({
            id: billDoc.id,
            ...billData,
            userName: 'Unknown User',
            userEmail: '',
            accountNumber: '',
          } as Bill);
        }
      }

      // Sort by due date (oldest first)
      billsWithUsers.sort((a, b) => {
        const dateA = new Date(a.dueDate || a.createdAt).getTime();
        const dateB = new Date(b.dueDate || b.createdAt).getTime();
        return dateA - dateB;
      });

      setResidentBills(billsWithUsers);
    } catch (error) {
      console.error('Error fetching unpaid bills:', error);
    } finally {
      setLoadingBills(false);
    }
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

  useEffect(() => {
    if (showUnpaidOnly) {
      fetchAllUnpaidBills();
    } else {
      fetchUserId().then(() => {
        fetchResidentBills();
      });
    }
  }, [user, showUnpaidOnly]);

  useEffect(() => {
    if (showUnpaidOnly) {
      return;
    }
    if (userId) {
      fetchResidentBills();
    }
  }, [userId, showUnpaidOnly]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (showUnpaidOnly) {
      fetchAllUnpaidBills().finally(() => setRefreshing(false));
    } else {
      fetchResidentBills().finally(() => setRefreshing(false));
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
    router.push({
      pathname: '/(tabs)/index',
      params: {
        payBillId: bill.id,
      },
    });
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
            {showUnpaidOnly && item.userName && (
              <View style={styles.billUserInfo}>
                <Text style={styles.billUserName}>
                  {item.accountNumber ? `${item.accountNumber} - ${item.userName}` : item.userName}
                </Text>
              </View>
            )}
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
          {item.consumptionUsed !== undefined ? (
            <View style={styles.billDetailRow}>
              <Text style={styles.billDetailLabel}>Consumption Used:</Text>
              <Text style={styles.billDetailValue}>{item.consumptionUsed.toFixed(2)} m³</Text>
            </View>
          ) : (
            <View style={styles.billDetailRow}>
              <Text style={styles.billDetailLabel}>Consumption:</Text>
              <Text style={styles.billDetailValue}>{item.consumption} m³</Text>
            </View>
          )}
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

  // Calculate resident stats
  const unpaidBills = residentBills.filter(bill => bill.status === 'unpaid' || bill.status === 'Unpaid' || bill.status === 'pending').length;
  const totalAmountDue = residentBills
    .filter(bill => bill.status === 'unpaid' || bill.status === 'Unpaid' || bill.status === 'pending')
    .reduce((sum, bill) => sum + bill.totalAmount, 0);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
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
    outstandingBalanceContainer: {
      backgroundColor: '#FEE2E2',
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    outstandingBalanceContent: {
      alignItems: 'center',
    },
    outstandingBalanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    outstandingBalanceLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#DC2626',
    },
    outstandingBalanceAmount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#DC2626',
      marginBottom: 4,
    },
    outstandingBalanceSubtext: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
    },
    billingListContent: {
      padding: 20,
      paddingBottom: 100,
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
      marginBottom: 4,
    },
    billUserInfo: {
      marginTop: 4,
    },
    billUserName: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '500',
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

  if (loadingBills) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title={showUnpaidOnly ? "Unpaid Bills" : "Billing Information"} 
          onUserPress={() => router.push('/(tabs)/profile')}
          profilePicUrl={user?.profilePicUrl}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading billing information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title={showUnpaidOnly ? "Unpaid Bills" : "Billing Information"} 
        onUserPress={() => router.push('/(tabs)/profile')}
        profilePicUrl={user?.profilePicUrl}
      />
      
      {/* Outstanding Balance Section */}
      {totalAmountDue > 0 && (
        <View style={styles.outstandingBalanceContainer}>
          <View style={styles.outstandingBalanceContent}>
            <View style={styles.outstandingBalanceHeader}>
              <Ionicons 
                name="alert-circle" 
                size={24} 
                color="#DC2626" 
              />
              <Text style={styles.outstandingBalanceLabel}>Outstanding Balance</Text>
            </View>
            <Text style={styles.outstandingBalanceAmount}>
              ₱{totalAmountDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.outstandingBalanceSubtext}>
              {unpaidBills} {unpaidBills === 1 ? 'bill' : 'bills'} unpaid
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={residentBills}
        renderItem={renderBillCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.billingListContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={80}
              color={Colors[colorScheme ?? 'light'].icon}
            />
            <Text style={styles.emptyText}>No bills found</Text>
            <Text style={styles.emptySubtext}>
              {showUnpaidOnly ? 'All bills have been paid' : 'Your billing records will appear here'}
            </Text>
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

