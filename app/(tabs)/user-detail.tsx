import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, db, doc, getDoc, getDocs, query, where } from '../../firebase';

interface UserDetail {
  id: string;
  age?: number;
  accountNumber?: string;
  contactNumber?: string;
  createdAt?: string;
  email: string;
  fullName: string;
  gender?: string;
  isArchived: boolean;
  meterNumber?: string;
  password?: string;
  passwordChanged?: boolean;
  paymentStatus?: string;
  profilePicUrl?: string;
  role: string;
  status: string;
}

export default function UserDetailScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const { userId, email } = params;
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [previousCoverageDate, setPreviousCoverageDate] = useState<Date | null>(null);
  const [previousConsumption, setPreviousConsumption] = useState('');
  const [presentDate, setPresentDate] = useState<Date | null>(null);
  const [presentConsumption, setPresentConsumption] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'present' | 'due' | null>(null);
  const [submittingBill, setSubmittingBill] = useState(false);
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [billingData, setBillingData] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [billToSubmit, setBillToSubmit] = useState<any>(null);
  const [waterRate, setWaterRate] = useState<number>(20.00);

  // Fetch water rate from Firestore settings
  const fetchWaterRate = async (): Promise<number> => {
    try {
      const settingsRef = doc(db, 'settings', 'kRaw13WFzXqfemqvdGPx');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        const rate = parseFloat(data.currentWaterRate || data.waterRate || '20.00');
        return isNaN(rate) ? 20.00 : rate;
      }
      return 20.00; // Default fallback
    } catch (error) {
      console.error('Error fetching water rate:', error);
      return 20.00; // Default fallback
    }
  };

  useEffect(() => {
    // Fetch water rate on component mount
    fetchWaterRate().then(rate => {
      setWaterRate(rate);
    });
    
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  // Auto-calculate total amount based on consumption difference
  useEffect(() => {
    if (presentConsumption && previousConsumption) {
      const presentValue = parseFloat(presentConsumption);
      const previousValue = parseFloat(previousConsumption);
      if (!isNaN(presentValue) && !isNaN(previousValue) && presentValue > previousValue) {
        const consumptionDiff = presentValue - previousValue;
        const calculatedTotal = consumptionDiff * waterRate;
        // Apply minimum payment of 150 if consumption is less than 10
        const finalTotal = consumptionDiff < 10 ? 150 : calculatedTotal;
        setTotalAmount(finalTotal.toFixed(2));
      } else {
        setTotalAmount('');
      }
    } else {
      setTotalAmount('');
    }
  }, [presentConsumption, previousConsumption, waterRate]);

  const fetchUserDetail = async () => {
    try {
      // Only accept userId (document ID from QR code)
      if (!userId || typeof userId !== 'string') {
        console.log('No valid userId provided');
        setLoading(false);
        return;
      }

      // Fetch user document directly by ID
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        setUserDetail({
          id: userDocSnap.id,
          age: userData.age,
          accountNumber: userData.accountNumber,
          contactNumber: userData.contactNumber,
          createdAt: userData.createdAt,
          email: userData.email,
          fullName: userData.fullName || userData.name || '',
          gender: userData.gender,
          isArchived: userData.isArchived || false,
          meterNumber: userData.meterNumber,
          password: userData.password,
          passwordChanged: userData.passwordChanged,
          paymentStatus: userData.paymentStatus,
          profilePicUrl: userData.profilePicUrl,
          role: userData.role,
          status: userData.status,
        });
      } else {
        console.log('No user found with ID:', userId);
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const handleAddBill = async () => {
    if (!userDetail) return;
    
    try {
      // Fetch the last bill for this user
      const billingRef = collection(db, 'billing');
      const q = query(
        billingRef, 
        where('userId', '==', userDetail.id)
      );
      const querySnapshot = await getDocs(q);
      
      const bills: any[] = [];
      querySnapshot.forEach((doc) => {
        bills.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      // Check if a bill for the current month already exists
      const currentMonthString = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const currentMonthBill = bills.find(bill => bill.month === currentMonthString);
      
      if (currentMonthBill) {
        Alert.alert(
          'Warning',
          `A bill for ${currentMonthString} already exists for this user. You can still create a bill for a different month by changing the present date.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => proceedToAddBill(bills) }
          ]
        );
        return;
      }
      
      proceedToAddBill(bills);
    } catch (error) {
      console.error('Error fetching last bill:', error);
      alert('Failed to load previous bill data');
    }
  };

  const proceedToAddBill = (bills: any[]) => {
    // Sort by createdAt to get the most recent bill
    bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (bills.length > 0) {
      const lastBill = bills[0];
      // Set previous data from the last bill's present data
      setPreviousCoverageDate(new Date(lastBill.coverageDateTo));
      setPreviousConsumption(lastBill.consumption.toString());
    } else {
      // First bill - set previous to null/empty
      setPreviousCoverageDate(null);
      setPreviousConsumption('0');
    }
    
    // Set present date to today by default
    setPresentDate(new Date());
    setPresentConsumption('');
    setDueDate(new Date());
    setTotalAmount('');
    setShowDatePicker(null);
    
    // Open form modal
    setFormModalVisible(true);
  };

  const handleSubmitBill = async () => {
    // Validate form fields (previousCoverageDate can be null for first bill)
    if (!presentDate || !dueDate || !presentConsumption || !totalAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const previousConsumptionValue = previousConsumption ? parseFloat(previousConsumption) : 0;
    const presentConsumptionValue = parseFloat(presentConsumption);
    const amountValueFloat = parseFloat(totalAmount);

    // Validate consumption values
    if (presentConsumptionValue <= previousConsumptionValue) {
      alert('Present consumption must be greater than previous consumption');
      return;
    }

    const consumptionDiff = presentConsumptionValue - previousConsumptionValue;

    // Validate the calculation (with minimum payment of 150 if consumption < 10)
    const calculatedAmount = consumptionDiff * waterRate;
    const expectedAmount = consumptionDiff < 10 ? 150 : calculatedAmount;
    if (Math.abs(amountValueFloat - expectedAmount) > 0.01) {
      alert('Amount calculation mismatch. Please check the consumption values.');
      return;
    }

    if (!userDetail) {
      alert('User information not available');
      return;
    }

    try {
      // Generate month string from present date
      const monthString = presentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Check if a bill for this month already exists
      const billingRef = collection(db, 'billing');
      const monthCheckQuery = query(
        billingRef,
        where('userId', '==', userDetail.id),
        where('month', '==', monthString)
      );
      const existingBillsSnapshot = await getDocs(monthCheckQuery);

      if (!existingBillsSnapshot.empty) {
        alert(`A bill for ${monthString} already exists for this user. Cannot create duplicate billing for the same month.`);
        return;
      }

      // Prepare bill data for confirmation
      const billData = {
        userId: userDetail.id,
        userEmail: userDetail.email,
        userName: userDetail.fullName,
        accountNumber: userDetail.accountNumber,
        meterNumber: userDetail.meterNumber || '',
        month: monthString,
        coverageDateFrom: previousCoverageDate ? previousCoverageDate.toISOString() : presentDate.toISOString(),
        coverageDateTo: presentDate.toISOString(),
        dueDate: dueDate.toISOString(),
        previousConsumption: previousConsumptionValue,
        consumption: presentConsumptionValue,
        consumptionUsed: consumptionDiff,
        waterRatePerCubicMeter: waterRate,
        totalAmount: amountValueFloat,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store bill data and show confirmation modal
      setBillToSubmit(billData);
      setIsConfirmed(false);
      setConfirmationModalVisible(true);
    } catch (error) {
      console.error('Error preparing bill:', error);
      alert('Failed to prepare bill. Please try again.');
    }
  };

  const handleConfirmAndSubmit = async () => {
    if (!isConfirmed) {
      alert('Please confirm that the billing information is correct');
      return;
    }

    if (!billToSubmit) {
      alert('No billing data to submit');
      return;
    }

    setSubmittingBill(true);

    try {
      // Save to Firestore billing collection
      const billingRef = collection(db, 'billing');
      const docRef = await addDoc(billingRef, billToSubmit);
      
      // Add document ID to bill data for receipt
      const receiptBillData = {
        ...billToSubmit,
        id: docRef.id,
      };

      // Create notification for the user about the new bill
      try {
        const notificationData = {
          userId: billToSubmit.userId,
          userEmail: billToSubmit.userEmail,
          userName: billToSubmit.userName,
          type: 'bill_created',
          title: 'New Bill Generated',
          message: `A new water bill for ${billToSubmit.month} (₱${billToSubmit.totalAmount.toFixed(2)}) has been generated. Please check your dashboard.`,
          billId: docRef.id,
          status: 'unread',
          createdAt: new Date().toISOString(),
        };

        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, notificationData);
        console.log('Notification created successfully for bill:', docRef.id);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // Send SMS notification to user
      try {
        console.log('=== SMS NOTIFICATION START ===');
        
        if (!userDetail?.contactNumber) {
          console.log('❌ No contact number available for SMS notification');
          console.log('User Detail:', userDetail);
          console.log('=== SMS NOTIFICATION END ===');
          return;
        }

        const phoneNumber = userDetail.contactNumber.replace(/[^0-9]/g, '');
        console.log('📱 Original Contact Number:', userDetail.contactNumber);
        console.log('📱 Cleaned Phone Number:', phoneNumber);
        
        const smsMessage = `WATER BILLING NOTICE
${billToSubmit.userName}
Billing Period: ${billToSubmit.month}
Previous: ${billToSubmit.previousConsumption} cubic meters
Current: ${billToSubmit.consumption} cubic meters
Usage: ${billToSubmit.consumptionUsed.toFixed(2)} cubic meters
Rate: PHP ${billToSubmit.waterRatePerCubicMeter} per cubic meter
AMOUNT DUE: PHP ${billToSubmit.totalAmount.toFixed(2)}
Due Date: ${formatDateForBill(billToSubmit.dueDate)}
Please pay on or before due date. Thank you.`;

        console.log('📄 SMS Message:', smsMessage);

        const smsApiUrl = 'https://sms.iprogtech.com/api/v1/sms_messages';
        const requestBody = {
          api_token: '22db33496bbfdb9e6557cf841d80f9ef0c809ccd',
          phone_number: phoneNumber,
          message: smsMessage,
        };

        console.log('🌐 SMS API URL:', smsApiUrl);
        console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));
        
        const smsResponse = await fetch(smsApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('📊 Response Status:', smsResponse.status);
        console.log('📊 Response Status Text:', smsResponse.statusText);
        console.log('📊 Response Headers:', JSON.stringify(Object.fromEntries(smsResponse.headers.entries()), null, 2));

        if (smsResponse.ok) {
          try {
            const responseData = await smsResponse.json();
            console.log('✅ SMS sent successfully!');
            console.log('📥 Response Data:', JSON.stringify(responseData, null, 2));
          } catch (jsonError) {
            const responseText = await smsResponse.text();
            console.log('✅ SMS sent successfully (non-JSON response)');
            console.log('📥 Response Text:', responseText);
          }
        } else {
          try {
            const errorData = await smsResponse.json();
            console.error('❌ SMS sending failed (JSON error):');
            console.error('Error Data:', JSON.stringify(errorData, null, 2));
          } catch (jsonError) {
            const errorText = await smsResponse.text();
            console.error('❌ SMS sending failed (Text error):');
            console.error('Error Text:', errorText);
          }
        }
        
        console.log('=== SMS NOTIFICATION END ===');
      } catch (smsError: any) {
        console.error('❌ SMS Exception occurred:');
        console.error('Error Name:', smsError?.name);
        console.error('Error Message:', smsError?.message);
        console.error('Error Stack:', smsError?.stack);
        console.error('Full Error:', smsError);
        console.log('=== SMS NOTIFICATION END (WITH ERROR) ===');
        // Don't fail the billing creation if SMS fails
      }

      // Close modals and reset
      setConfirmationModalVisible(false);
      setFormModalVisible(false);
      setBillToSubmit(null);
      setIsConfirmed(false);
      setPreviousCoverageDate(null);
      setPreviousConsumption('');
      setPresentDate(null);
      setPresentConsumption('');
      setDueDate(null);
      setTotalAmount('');
      setShowDatePicker(null);

      // Navigate to receipt screen with bill data
      router.push({
        pathname: '/(tabs)/receipt',
        params: {
          billData: JSON.stringify(receiptBillData),
        },
      });
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Failed to save bill. Please try again.');
    } finally {
      setSubmittingBill(false);
    }
  };

  const handleCancelForm = () => {
    setFormModalVisible(false);
    setPreviousCoverageDate(null);
    setPreviousConsumption('');
    setPresentDate(null);
    setPresentConsumption('');
    setDueDate(null);
    setTotalAmount('');
    setShowDatePicker(null);
  };

  const fetchUserBilling = async () => {
    if (!userDetail) return;

    setLoadingBilling(true);
    try {
      const billingRef = collection(db, 'billing');
      const q = query(billingRef, where('userId', '==', userDetail.id));
      const querySnapshot = await getDocs(q);

      const bills: any[] = [];
      querySnapshot.forEach((doc) => {
        bills.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by createdAt (newest first)
      bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Filter out duplicate months, keeping only the most recent bill for each month
      const uniqueMonthBills: any[] = [];
      const seenMonths = new Set<string>();

      bills.forEach((bill) => {
        const month = bill.month || 'Unknown';
        if (!seenMonths.has(month)) {
          seenMonths.add(month);
          uniqueMonthBills.push(bill);
        }
      });

      setBillingData(uniqueMonthBills);
    } catch (error) {
      console.error('Error fetching billing:', error);
      alert('Failed to fetch billing data');
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleViewBilling = () => {
    setBillingModalVisible(true);
    fetchUserBilling();
  };

  const formatDateForBill = (dateString: string) => {
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

  const renderBillItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={styles.billMonth}>{item.month}</Text>
            <Text style={styles.billDate}>
              {formatDateForBill(item.coverageDateFrom)} - {formatDateForBill(item.coverageDateTo)}
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
          {item.previousConsumption !== undefined && (
            <View style={styles.billDetailRow}>
              <Text style={styles.billDetailLabel}>Previous Consumption:</Text>
              <Text style={styles.billDetailValue}>{item.previousConsumption} m³</Text>
            </View>
          )}
          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Present Consumption:</Text>
            <Text style={styles.billDetailValue}>{item.consumption} m³</Text>
          </View>
          {item.consumptionUsed !== undefined && (
            <View style={styles.billDetailRow}>
              <Text style={styles.billDetailLabel}>Consumption Used:</Text>
              <Text style={styles.billDetailValue}>{item.consumptionUsed.toFixed(2)} m³</Text>
            </View>
          )}
          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Due Date:</Text>
            <Text style={styles.billDetailValue}>{formatDateForBill(item.dueDate)}</Text>
          </View>
          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Total Amount:</Text>
            <Text style={styles.billDetailAmount}>₱{item.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date, field: 'present' | 'due' = 'present') => {
    const currentDate = selectedDate || new Date();

    if (Platform.OS === 'android') {
      setShowDatePicker(null);
      if (event.type === 'set') {
        if (field === 'present') {
          setPresentDate(currentDate);
        } else if (field === 'due') {
          setDueDate(currentDate);
        }
      }
    } else {
      // iOS
      if (field === 'present') {
        setPresentDate(currentDate);
      } else if (field === 'due') {
        setDueDate(currentDate);
      }
    }
  };

  const handleOpenScanner = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan meter readings.');
        return;
      }

      // Launch camera with built-in editing (cropping) enabled
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // This enables the built-in crop UI
        aspect: [16, 9], // Suggested aspect ratio for meter readings
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProcessingOCR(true);
        const imageUri = result.assets[0].uri;
        
        // Process the cropped image for OCR
        const finalImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }],
          { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (finalImage.base64) {
          const sizeInKB = (finalImage.base64.length * 3) / 4 / 1024;
          console.log(`Final image size: ${sizeInKB.toFixed(2)} KB`);
          
          if (sizeInKB > 1024) {
            Alert.alert('Image Too Large', 'The image is still too large. Please try again.');
            setProcessingOCR(false);
            return;
          }
          
          await performOCR(finalImage.base64);
        }
      }
    } catch (error) {
      console.error('Scanner error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const extractNumbersFromText = (text: string): string => {
    // Extract all numbers from the text
    const numbers = text.match(/\d+\.?\d*/g);
    if (!numbers || numbers.length === 0) return '';
    
    // Find the longest number (most likely to be the meter reading)
    const longestNumber = numbers.reduce((a, b) => a.length > b.length ? a : b);
    return longestNumber;
  };

  const performOCR = async (base64Image: string) => {
    setProcessingOCR(true);
    try {
      // Using OCR.space API with API key for better performance
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');
      formData.append('apikey', 'K83043314988957');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': 'K83043314988957',
        },
        body: formData,
      });

      const result = await response.json();
 
      console.log(result);
      
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        const parsedText = result.ParsedResults[0].ParsedText;
        const extractedNumber = extractNumbersFromText(parsedText);
        
        if (extractedNumber) {
          setPresentConsumption(extractedNumber);
          Alert.alert('Success', `Detected reading: ${extractedNumber}`, [
            { text: 'OK' }
          ]);
        } else {
          Alert.alert('No Number Found', 'Could not detect a number from the image. Please try again or enter manually.');
        }
      } else {
        const errorMessage = result.ErrorMessage || result.OCRExitCode 
          ? `OCR Error: ${result.ErrorMessage?.[0] || 'Unknown error'}` 
          : 'Could not read text from the image. Please try again or enter manually.';
        Alert.alert('OCR Failed', errorMessage);
      }
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again or enter manually.');
    } finally {
      setProcessingOCR(false);
    }
  };


  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      paddingBottom: 80,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    profileCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      marginTop: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 3,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 60,
    },
    avatarText: {
      fontSize: 42,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    nameText: {
      fontSize: 26,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      textAlign: 'center',
      marginBottom: 8,
    },
    roleText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].primary,
      textAlign: 'center',
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    infoSection: {
      marginTop: 8,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      marginBottom: 10,
    },
    infoIcon: {
      marginRight: 12,
      marginTop: 2,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 15,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '600',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    statusActive: {
      backgroundColor: '#D1FAE5',
    },
    statusInactive: {
      backgroundColor: '#FEE2E2',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    paymentStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    paymentPaid: {
      backgroundColor: '#D1FAE5',
    },
    paymentUnpaid: {
      backgroundColor: '#FEE2E2',
    },
    paymentText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
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
    buttonContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    buttonSpacing: {
      height: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    viewBillingButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    viewBillingButtonText: {
      color: Colors[colorScheme ?? 'light'].primary,
      fontSize: 16,
      fontWeight: '600',
    },
    addBillButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    buttonIcon: {
      marginRight: 8,
    },
    addBillButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '70%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    closeButton: {
      padding: 4,
    },
    formModalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: 20,
    },
    formHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    formTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    formContent: {
      padding: 20,
    },
    formField: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    readOnlyInput: {
      opacity: 0.7,
      backgroundColor: Colors[colorScheme ?? 'light'].border,
    },
    rateInfo: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 6,
      fontStyle: 'italic',
    },
    dateInput: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 12,
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateInputText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    dateInputPlaceholder: {
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    iosPickerContainer: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      marginTop: 8,
      overflow: 'hidden',
    },
    iosPickerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    iosPickerButton: {
      paddingVertical: 8,
    },
    iosPickerButtonText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
    },
    iosPickerButtonConfirm: {
      color: Colors[colorScheme ?? 'light'].primary,
      fontWeight: '600',
    },
    formButtons: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginTop: 10,
    },
    formButtonSpacing: {
      width: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    cancelButtonText: {
      color: Colors[colorScheme ?? 'light'].text,
      fontSize: 16,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    disabledButton: {
      opacity: 0.6,
    },
    submitButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonSpinner: {
      marginRight: 8,
    },
    billingModalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: 20,
    },
    billingList: {
      padding: 20,
    },
    billCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
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
      marginTop: 8,
    },
    billDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    billDetailLabel: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
    },
    billDetailValue: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '600',
    },
    billDetailAmount: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].primary,
      fontWeight: 'bold',
    },
    billingLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    billingLoadingText: {
      marginTop: 16,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
    },
    billingEmptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    billingEmptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginTop: 16,
    },
    billingEmptySubtext: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 8,
      textAlign: 'center',
    },
    inputWithButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    formInputWithIcon: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    scanButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      padding: 14,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    confirmationOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    confirmationModalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 24,
      width: '100%',
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    confirmationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    confirmationTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    confirmationContent: {
      padding: 20,
      maxHeight: '70%',
    },
    confirmationSubtitle: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginBottom: 20,
      textAlign: 'center',
    },
    confirmationDetailsContainer: {
      gap: 16,
    },
    confirmationSection: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    confirmationSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors[colorScheme ?? 'light'].primary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    confirmationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    confirmationLabel: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
      flex: 1,
    },
    confirmationValue: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '600',
      flex: 1,
      textAlign: 'right',
    },
    confirmationHighlight: {
      color: Colors[colorScheme ?? 'light'].primary,
      fontWeight: '700',
    },
    confirmationTotalSection: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary + '15',
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderWidth: 2,
    },
    confirmationTotalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      flex: 1,
    },
    confirmationTotalValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
      flex: 1,
      textAlign: 'right',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      marginTop: 8,
      marginBottom: 50,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    checkboxChecked: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      lineHeight: 20,
    },
    confirmationFooter: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme ?? 'light'].border,
    },
    confirmationCancelButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    confirmationCancelButtonText: {
      color: Colors[colorScheme ?? 'light'].text,
      fontSize: 16,
      fontWeight: '600',
    },
    confirmationSubmitButton: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    confirmationSubmitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="User Details" 
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading user details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userDetail) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="User Details" 
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={Colors[colorScheme ?? 'light'].icon}
          />
          <Text style={styles.loadingText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title="User Details" 
        onUserPress={() => router.push('/(tabs)/profile')}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {userDetail.profilePicUrl ? (
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: userDetail.profilePicUrl }}
                  style={styles.avatarImage}
                />
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(userDetail.fullName)}
                </Text>
              </View>
            )}
            <Text style={styles.nameText}>{userDetail.accountNumber || userDetail.fullName}</Text>
            <Text style={styles.roleText}>{userDetail.role}</Text>
          </View>

          {/* User Information */}
          <View style={styles.infoSection}>
            {userDetail.accountNumber && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="card"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Account Number</Text>
                  <Text style={styles.infoValue}>{userDetail.accountNumber}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="mail"
                  size={20}
                  color={Colors[colorScheme ?? 'light'].primary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{userDetail.email}</Text>
              </View>
            </View>

            {userDetail.contactNumber && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="call"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Contact Number</Text>
                  <Text style={styles.infoValue}>{userDetail.contactNumber}</Text>
                </View>
              </View>
            )}

            {userDetail.gender && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{userDetail.gender}</Text>
                </View>
              </View>
            )}

            {userDetail.age && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{userDetail.age} years old</Text>
                </View>
              </View>
            )}

            {userDetail.meterNumber && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="flash"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Meter Number</Text>
                  <Text style={styles.infoValue}>{userDetail.meterNumber}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={Colors[colorScheme ?? 'light'].primary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>
                  {userDetail.status ? userDetail.status.charAt(0).toUpperCase() + userDetail.status.slice(1) : 'N/A'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    userDetail.status === 'active'
                      ? styles.statusActive
                      : styles.statusInactive,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {userDetail.status === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>

           

            {userDetail.createdAt && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="time"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>{formatDate(userDetail.createdAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewBillingButton]}
            onPress={handleViewBilling}
          >
            <Ionicons
              name="document-text"
              size={24}
              color={Colors[colorScheme ?? 'light'].primary}
              style={styles.buttonIcon}
            />
            <Text style={styles.viewBillingButtonText}>View Billing</Text>
          </TouchableOpacity>
          <View style={styles.buttonSpacing} />
          <TouchableOpacity
            style={styles.addBillButton}
            onPress={handleAddBill}
          >
            <Ionicons
              name="add-circle"
              size={24}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.addBillButtonText}>Add Bill</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bill Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={formModalVisible}
        onRequestClose={handleCancelForm}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCancelForm}
        >
          <View style={styles.formModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Add Bill</Text>
              <TouchableOpacity
                onPress={handleCancelForm}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContent}>
              {/* Previous Coverage Section */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Previous Coverage Date</Text>
                <View style={[styles.dateInput, styles.readOnlyInput]}>
                  <Text style={styles.dateInputText}>
                    {previousCoverageDate ? formatDateForDisplay(previousCoverageDate) : 'No previous bill'}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Previous Consumption (cubic meters)</Text>
                <TextInput
                  style={[styles.formInput, styles.readOnlyInput]}
                  value={previousConsumption}
                  editable={false}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Present Coverage Section */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Present Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker('present')}
                >
                  <Text style={[
                    styles.dateInputText,
                    !presentDate && styles.dateInputPlaceholder
                  ]}>
                    {formatDateForDisplay(presentDate)}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </TouchableOpacity>
                {showDatePicker === 'present' && (
                  <>
                    {Platform.OS === 'ios' && (
                      <View style={styles.iosPickerContainer}>
                        <View style={styles.iosPickerButtons}>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(null)}
                            style={styles.iosPickerButton}
                          >
                            <Text style={styles.iosPickerButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(null)}
                            style={styles.iosPickerButton}
                          >
                            <Text style={[styles.iosPickerButtonText, styles.iosPickerButtonConfirm]}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={presentDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={(event, date) => handleDateChange(event, date, 'present')}
                          textColor={Colors[colorScheme ?? 'light'].text}
                        />
                      </View>
                    )}
                    {Platform.OS === 'android' && (
                      <DateTimePicker
                        value={presentDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          handleDateChange(event, date, 'present');
                          setShowDatePicker(null);
                        }}
                      />
                    )}
                  </>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Present Consumption (cubic meters)</Text>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={styles.formInputWithIcon}
                    placeholder="0.00"
                    placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    value={presentConsumption}
                    onChangeText={setPresentConsumption}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={handleOpenScanner}
                  >
                    <Ionicons
                      name="scan"
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Due Date */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Due Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker('due')}
                >
                  <Text style={[
                    styles.dateInputText,
                    !dueDate && styles.dateInputPlaceholder
                  ]}>
                    {formatDateForDisplay(dueDate)}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </TouchableOpacity>
                {showDatePicker === 'due' && (
                  <>
                    {Platform.OS === 'ios' && (
                      <View style={styles.iosPickerContainer}>
                        <View style={styles.iosPickerButtons}>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(null)}
                            style={styles.iosPickerButton}
                          >
                            <Text style={styles.iosPickerButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(null)}
                            style={styles.iosPickerButton}
                          >
                            <Text style={[styles.iosPickerButtonText, styles.iosPickerButtonConfirm]}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={dueDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={(event, date) => handleDateChange(event, date, 'due')}
                          textColor={Colors[colorScheme ?? 'light'].text}
                        />
                      </View>
                    )}
                    {Platform.OS === 'android' && (
                      <DateTimePicker
                        value={dueDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          handleDateChange(event, date, 'due');
                          setShowDatePicker(null);
                        }}
                      />
                    )}
                  </>
                )}
              </View>

              {/* Total Amount */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Total Amount (PHP)</Text>
                <TextInput
                  style={[styles.formInput, styles.readOnlyInput]}
                  placeholder="Auto-calculated"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={totalAmount ? `₱${totalAmount}` : ''}
                  editable={false}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.rateInfo}>
                  Rate: ₱{waterRate.toFixed(2)} per cubic meter
                </Text>
              </View>
            </ScrollView>
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, submittingBill && styles.disabledButton]}
                onPress={handleCancelForm}
                disabled={submittingBill}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.formButtonSpacing} />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitBill}
              >
                <Text style={styles.submitButtonText}>Review & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Billing History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={billingModalVisible}
        onRequestClose={() => setBillingModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setBillingModalVisible(false)}
        >
          <View style={styles.billingModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Billing History</Text>
              <TouchableOpacity
                onPress={() => setBillingModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].text}
                />
              </TouchableOpacity>
            </View>
            {loadingBilling ? (
              <View style={styles.billingLoadingContainer}>
                <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
                <Text style={styles.billingLoadingText}>Loading billing data...</Text>
              </View>
            ) : billingData.length === 0 ? (
              <View style={styles.billingEmptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={60}
                  color={Colors[colorScheme ?? 'light'].icon}
                />
                <Text style={styles.billingEmptyText}>No billing records found</Text>
                <Text style={styles.billingEmptySubtext}>This user hasn't been billed yet</Text>
              </View>
            ) : (
              <FlatList
                data={billingData}
                renderItem={renderBillItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.billingList}
                showsVerticalScrollIndicator={true}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={() => setConfirmationModalVisible(false)}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModalContent}>
            <View style={styles.confirmationHeader}>
              <Text style={styles.confirmationTitle}>Confirm Billing Details</Text>
              <TouchableOpacity
                onPress={() => setConfirmationModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.confirmationContent}>
              <Text style={styles.confirmationSubtitle}>
                Please review the billing information carefully before submitting
              </Text>

              {billToSubmit && (
                <View style={styles.confirmationDetailsContainer}>
                  {/* User Info Section */}
                  <View style={styles.confirmationSection}>
                    <Text style={styles.confirmationSectionTitle}>User Information</Text>
                    {billToSubmit.accountNumber && (
                      <View style={styles.confirmationRow}>
                        <Text style={styles.confirmationLabel}>Account Number:</Text>
                        <Text style={styles.confirmationValue}>{billToSubmit.accountNumber}</Text>
                      </View>
                    )}
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Name:</Text>
                      <Text style={styles.confirmationValue}>{billToSubmit.userName}</Text>
                    </View>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Email:</Text>
                      <Text style={styles.confirmationValue}>{billToSubmit.userEmail}</Text>
                    </View>
                    {billToSubmit.meterNumber && (
                      <View style={styles.confirmationRow}>
                        <Text style={styles.confirmationLabel}>Meter Number:</Text>
                        <Text style={styles.confirmationValue}>{billToSubmit.meterNumber}</Text>
                      </View>
                    )}
                  </View>

                  {/* Billing Period Section */}
                  <View style={styles.confirmationSection}>
                    <Text style={styles.confirmationSectionTitle}>Billing Period</Text>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Month:</Text>
                      <Text style={[styles.confirmationValue, styles.confirmationHighlight]}>
                        {billToSubmit.month}
                      </Text>
                    </View>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Coverage:</Text>
                      <Text style={styles.confirmationValue}>
                        {formatDateForBill(billToSubmit.coverageDateFrom)} - {formatDateForBill(billToSubmit.coverageDateTo)}
                      </Text>
                    </View>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Due Date:</Text>
                      <Text style={styles.confirmationValue}>
                        {formatDateForBill(billToSubmit.dueDate)}
                      </Text>
                    </View>
                  </View>

                  {/* Consumption Section */}
                  <View style={styles.confirmationSection}>
                    <Text style={styles.confirmationSectionTitle}>Water Consumption</Text>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Previous Reading:</Text>
                      <Text style={styles.confirmationValue}>{billToSubmit.previousConsumption} m³</Text>
                    </View>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Present Reading:</Text>
                      <Text style={styles.confirmationValue}>{billToSubmit.consumption} m³</Text>
                    </View>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Consumption Used:</Text>
                      <Text style={[styles.confirmationValue, styles.confirmationHighlight]}>
                        {billToSubmit.consumptionUsed.toFixed(2)} m³
                      </Text>
                    </View>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationLabel}>Rate per m³:</Text>
                      <Text style={styles.confirmationValue}>
                        ₱{billToSubmit.waterRatePerCubicMeter.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Total Amount Section */}
                  <View style={[styles.confirmationSection, styles.confirmationTotalSection]}>
                    <View style={styles.confirmationRow}>
                      <Text style={styles.confirmationTotalLabel}>Total Amount:</Text>
                      <Text style={styles.confirmationTotalValue}>
                        ₱{billToSubmit.totalAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Confirmation Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setIsConfirmed(!isConfirmed)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
                      {isConfirmed && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I confirm that all billing information above is correct
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.confirmationFooter}>
              <TouchableOpacity
                style={[styles.confirmationCancelButton, submittingBill && styles.disabledButton]}
                onPress={() => setConfirmationModalVisible(false)}
                disabled={submittingBill}
              >
                <Text style={styles.confirmationCancelButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={styles.formButtonSpacing} />
              <TouchableOpacity
                style={[
                  styles.confirmationSubmitButton,
                  (!isConfirmed || submittingBill) && styles.disabledButton
                ]}
                onPress={handleConfirmAndSubmit}
                disabled={!isConfirmed || submittingBill}
              >
                {submittingBill ? (
                  <View style={styles.submitButtonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.submitButtonSpinner} />
                    <Text style={styles.confirmationSubmitButtonText}>Submitting...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.confirmationSubmitButtonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

