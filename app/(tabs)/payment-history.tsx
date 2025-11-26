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
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, db, doc, getDocs, query, updateDoc, where } from '../../firebase';

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  billId: string;
  billMonth: string;
  billAmount: number;
  paymentMethod: string;
  paymentProof: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function PaymentHistoryScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);

  // Check if user is a collector/admin (not a resident)
  const isCollector = user?.position?.toLowerCase() !== 'resident' && 
                     user?.position?.toLowerCase() !== 'residents';

  const fetchPayments = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      let paymentsQuery;
      
      // If collector/admin, fetch all payments; otherwise, fetch only user's payments
      if (isCollector) {
        paymentsQuery = query(collection(db, 'payments'));
      } else {
        paymentsQuery = query(
          collection(db, 'payments'),
          where('userEmail', '==', user.email)
        );
      }
      
      const querySnapshot = await getDocs(paymentsQuery);
      
      const paymentsData: Payment[] = [];
      querySnapshot.forEach((doc) => {
        paymentsData.push({
          id: doc.id,
          ...doc.data(),
        } as Payment);
      });

      // Sort by date (newest first)
      paymentsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user, isCollector]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handleConfirmPayment = async (payment: Payment) => {
    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to confirm the payment of ₱${payment.billAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${payment.billMonth}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConfirmingPaymentId(payment.id);
            try {
              // Update payment status to approved
              const paymentRef = doc(db, 'payments', payment.id);
              await updateDoc(paymentRef, {
                status: 'approved',
                updatedAt: new Date().toISOString(),
              });

              // Update bill status to paid
              if (payment.billId) {
                const billRef = doc(db, 'billing', payment.billId);
                await updateDoc(billRef, {
                  status: 'paid',
                  updatedAt: new Date().toISOString(),
                });
              }

              // Create notification for the user
              try {
                const notificationData = {
                  userId: payment.userId,
                  userEmail: payment.userEmail,
                  userName: payment.userName,
                  type: 'payment_approved',
                  title: 'Payment Approved',
                  message: `Your payment of ₱${payment.billAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${payment.billMonth} has been approved.`,
                  paymentId: payment.id,
                  billId: payment.billId,
                  status: 'unread',
                  createdAt: new Date().toISOString(),
                };

                const notificationsRef = collection(db, 'notifications');
                await addDoc(notificationsRef, notificationData);
              } catch (notificationError) {
                console.error('Error creating notification:', notificationError);
                // Don't fail the payment confirmation if notification fails
              }

              // Refresh payments list
              await fetchPayments();

              Alert.alert('Success', 'Payment confirmed successfully!');
            } catch (error) {
              console.error('Error confirming payment:', error);
              Alert.alert('Error', 'Failed to confirm payment. Please try again.');
            } finally {
              setConfirmingPaymentId(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectPayment = async (payment: Payment) => {
    Alert.alert(
      'Reject Payment',
      `Are you sure you want to reject the payment of ₱${payment.billAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${payment.billMonth}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejectingPaymentId(payment.id);
            try {
              // Update payment status to rejected
              const paymentRef = doc(db, 'payments', payment.id);
              await updateDoc(paymentRef, {
                status: 'rejected',
                updatedAt: new Date().toISOString(),
              });

              // Update bill status back to unpaid
              if (payment.billId) {
                const billRef = doc(db, 'billing', payment.billId);
                await updateDoc(billRef, {
                  status: 'unpaid',
                  updatedAt: new Date().toISOString(),
                });
              }

              // Create notification for the user
              try {
                const notificationData = {
                  userId: payment.userId,
                  userEmail: payment.userEmail,
                  userName: payment.userName,
                  type: 'payment_rejected',
                  title: 'Payment Rejected',
                  message: `Your payment of ₱${payment.billAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${payment.billMonth} has been rejected. Please resubmit with valid proof.`,
                  paymentId: payment.id,
                  billId: payment.billId,
                  status: 'unread',
                  createdAt: new Date().toISOString(),
                };

                const notificationsRef = collection(db, 'notifications');
                await addDoc(notificationsRef, notificationData);
              } catch (notificationError) {
                console.error('Error creating notification:', notificationError);
                // Don't fail the payment rejection if notification fails
              }

              // Refresh payments list
              await fetchPayments();

              Alert.alert('Success', 'Payment rejected successfully!');
            } catch (error) {
              console.error('Error rejecting payment:', error);
              Alert.alert('Error', 'Failed to reject payment. Please try again.');
            } finally {
              setRejectingPaymentId(null);
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
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#059669';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#DC2626';
      default:
        return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentMonth}>{item.billMonth}</Text>
          {isCollector && item.userName && (
            <Text style={styles.userName}>{item.userName}</Text>
          )}
          <Text style={styles.paymentDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>₱{item.billAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Method:</Text>
          <Text style={styles.detailValue}>{item.paymentMethod}</Text>
        </View>
      </View>

      {item.paymentProof && (
        <TouchableOpacity
          style={styles.proofContainer}
          onPress={() => setSelectedImage(item.paymentProof)}
        >
          <Image
            source={{ uri: item.paymentProof }}
            style={styles.proofThumbnail}
          />
          <View style={styles.proofOverlay}>
            <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
            <Text style={styles.proofText}>View Proof</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Confirm and Reject Payment Buttons for Collectors */}
      {isCollector && item.status === 'pending' && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectPayment(item)}
            disabled={rejectingPaymentId === item.id || confirmingPaymentId === item.id}
          >
            {rejectingPaymentId === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleConfirmPayment(item)}
            disabled={confirmingPaymentId === item.id || rejectingPaymentId === item.id}
          >
            {confirmingPaymentId === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      padding: 16,
      paddingBottom: 102,
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 8,
      textAlign: 'center',
    },
    paymentCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentMonth: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 2,
    },
    userName: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].primary,
      marginBottom: 2,
    },
    paymentDate: {
      fontSize: 11,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    paymentDetails: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme ?? 'light'].border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 13,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    proofContainer: {
      marginTop: 8,
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative',
    },
    proofThumbnail: {
      width: '100%',
      height: 120,
      resizeMode: 'cover',
    },
    proofOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    proofText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    actionButtonsContainer: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 8,
    },
    confirmButton: {
      flex: 1,
      backgroundColor: '#059669',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    rejectButton: {
      flex: 1,
      backgroundColor: '#DC2626',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rejectButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    imageModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageModalClose: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      padding: 10,
    },
    modalImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader
          title="Payment History"
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Payment History"
        onUserPress={() => router.push('/(tabs)/profile')}
      />
      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={80}
              color={Colors[colorScheme ?? 'light'].icon}
            />
            <Text style={styles.emptyText}>No payment history</Text>
            <Text style={styles.emptySubtext}>
              Your payment records will appear here
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

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          style={styles.imageModal}
          onPress={() => setSelectedImage(null)}
        >
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.modalImage} />
          )}
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
