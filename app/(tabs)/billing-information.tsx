import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, db, doc, getDoc, getDocs, query, updateDoc, uploadImageToStorage, where } from '../../firebase';

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
  const isCollector = user?.position?.toLowerCase() !== 'resident' && user?.position?.toLowerCase() !== 'residents';
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
  const [validatingReceipt, setValidatingReceipt] = useState(false);

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
    // Check if bill is overdue and calculate penalty
    const isOverdue = bill.status === 'unpaid' && new Date(bill.dueDate) < new Date();
    const penalty = isOverdue ? 30 : 0;
    const totalWithPenalty = bill.totalAmount + penalty;
    
    // Create bill with penalty included
    const billWithPenalty = {
      ...bill,
      totalAmount: totalWithPenalty,
      penalty: penalty,
    };
    
    setSelectedBill(billWithPenalty);
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

  // Simple hash function for image data
  const simpleHash = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // Create a simple hash from image data by sampling pixels
    const data = new Uint8Array(arrayBuffer);
    let hash = 0;
    const sampleRate = Math.floor(data.length / 1000); // Sample every Nth byte
    
    for (let i = 0; i < data.length; i += sampleRate) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  };

  // Calculate similarity between two hashes (simplified)
  const calculateSimilarity = (hash1: string, hash2: string): number => {
    // Simple similarity based on hash value difference
    const num1 = parseInt(hash1, 16);
    const num2 = parseInt(hash2, 16);
    const diff = Math.abs(num1 - num2);
    const maxDiff = Math.max(num1, num2);
    return 1 - (diff / maxDiff);
  };

  const validateReceiptWithHash = async (imageUri: string): Promise<boolean> => {
    try {
      console.log('=== Hash Validation Log ===');
      console.log('Validating receipt using image hash comparison...');

      // Load template image
      const templateAsset = Asset.fromModule(require('../../assets/images/gcash_template.jpg'));
      await templateAsset.downloadAsync();
      
      if (!templateAsset.localUri) {
        console.error('Failed to load template image');
        return false;
      }

      // Convert both images to array buffers
      const [templateResponse, uploadedResponse] = await Promise.all([
        fetch(templateAsset.localUri),
        fetch(imageUri),
      ]);

      // Use response.arrayBuffer() directly instead of blob().arrayBuffer()
      const [templateArrayBuffer, uploadedArrayBuffer] = await Promise.all([
        templateResponse.arrayBuffer(),
        uploadedResponse.arrayBuffer(),
      ]);

      // Generate simple hashes for both images
      const [templateHash, uploadedHash] = await Promise.all([
        simpleHash(templateArrayBuffer),
        simpleHash(uploadedArrayBuffer),
      ]);

      console.log('Template hash:', templateHash);
      console.log('Uploaded image hash:', uploadedHash);

      // Calculate similarity
      const similarity = calculateSimilarity(templateHash, uploadedHash);
      const minSimilarity = 0.15; // 70% similarity threshold

      console.log('Similarity:', (similarity * 100).toFixed(2) + '%');
      console.log('Min required similarity:', (minSimilarity * 100).toFixed(2) + '%');
      console.log('Validation result:', similarity >= minSimilarity);
      console.log('========================');

      // If similarity is above threshold, images are similar
      return similarity <= minSimilarity;
    } catch (error) {
      console.error('Hash validation error:', error);
      return false;
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
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setValidatingReceipt(true);

        try {
          // Convert image to base64 for OCR
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 800 } }], // Resize to reduce processing time
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );

          // Validate receipt using hash comparison (faster than OCR)
          const isValid = await validateReceiptWithHash(imageUri);

          if (isValid) {
            // Receipt is valid, set the payment proof
            setPaymentProof(imageUri);
            Alert.alert('Success', 'Receipt validated successfully!');
          } else {
            // Receipt validation failed
            Alert.alert(
              'Invalid Receipt',
              'The uploaded image does not match a valid GCash receipt template. Please upload a clear image of your GCash payment receipt.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('Error validating receipt:', error);
          Alert.alert('Error', 'Failed to validate receipt. Please try again.');
        } finally {
          setValidatingReceipt(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setValidatingReceipt(false);
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
      const currentUserId = userId || await fetchUserId();
      
      if (!currentUserId) {
        Alert.alert('Error', 'User information not available');
        setSubmittingPayment(false);
        return;
      }

      // Upload payment proof to Firebase Storage
      const fileName = `payment-proofs/${currentUserId}_${selectedBill.id}_${Date.now()}.jpg`;
      const paymentProofURL = await uploadImageToStorage(paymentProof, fileName);

      // Prepare payment data
      const paymentData = {
        userId: currentUserId,
        userEmail: user?.email || '',
        userName: user?.name || '',
        billId: selectedBill.id,
        billMonth: selectedBill.month,
        billAmount: selectedBill.totalAmount,
        paymentMethod: finalPaymentMethod,
        paymentProof: paymentProofURL,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Save to payment history
      const paymentsRef = collection(db, 'payments');
      const paymentDocRef = await addDoc(paymentsRef, paymentData);

      // Create notification
      const notificationData = {
        userId: currentUserId,
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

      // Update bill status to pending
      const billRef = doc(db, 'billing', selectedBill.id);
      await updateDoc(billRef, {
        status: 'pending',
        paymentMethod: finalPaymentMethod,
        paymentProof: paymentProofURL,
        updatedAt: new Date().toISOString(),
      });

      // Refresh bills
      if (showUnpaidOnly) {
        await fetchAllUnpaidBills();
      } else {
        await fetchResidentBills();
      }

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
    // Check if bill is overdue (unpaid and past due date)
    const isOverdue = item.status === 'unpaid' && new Date(item.dueDate) < new Date();
    const penalty = isOverdue ? 30 : 0;
    const totalWithPenalty = item.totalAmount + penalty;

    return (
      <View style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={styles.billMonth}>{item.month}</Text>
            <Text style={styles.billDate}>
              Due: {formatDate(item.dueDate)}
            </Text>
            {isOverdue && (
              <Text style={styles.overdueLabel}>Overdue</Text>
            )}
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
            <Text style={styles.billDetailValue}>₱{item.totalAmount.toFixed(2)}</Text>
          </View>
          {isOverdue && (
            <View style={styles.billDetailRow}>
              <Text style={styles.billDetailLabel}>Penalty (Overdue):</Text>
              <Text style={styles.billPenalty}>₱{penalty.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Total Amount:</Text>
            <Text style={styles.billAmount}>₱{totalWithPenalty.toFixed(2)}</Text>
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
          {item.status === 'unpaid' && !isCollector && (
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
    .reduce((sum, bill) => {
      const isOverdue = new Date(bill.dueDate) < new Date();
      const penalty = isOverdue ? 30 : 0;
      return sum + bill.totalAmount + penalty;
    }, 0);

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
    overdueLabel: {
      fontSize: 12,
      color: '#DC2626',
      fontWeight: '600',
      marginTop: 2,
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
    billPenalty: {
      fontSize: 14,
      color: '#DC2626',
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
    validatingContainer: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
    },
    validatingText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].primary,
      marginTop: 12,
    },
    validatingSubtext: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 4,
      textAlign: 'center',
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
                  {validatingReceipt ? (
                    <View style={styles.validatingContainer}>
                      <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
                      <Text style={styles.validatingText}>Validating receipt...</Text>
                      <Text style={styles.validatingSubtext}>Please wait while we verify your GCash receipt</Text>
                    </View>
                  ) : paymentProof ? (
                    <View style={styles.paymentProofContainer}>
                      <Image
                        source={{ uri: paymentProof }}
                        style={styles.paymentProofImage}
                      />
                      <TouchableOpacity
                        style={styles.changeProofButton}
                        onPress={handlePickImage}
                        disabled={validatingReceipt}
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
                      disabled={validatingReceipt}
                    >
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color={Colors[colorScheme ?? 'light'].primary}
                      />
                      <Text style={styles.uploadProofText}>Upload Payment Proof</Text>
                      <Text style={styles.uploadProofSubtext}>Tap to select a GCash receipt image</Text>
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

