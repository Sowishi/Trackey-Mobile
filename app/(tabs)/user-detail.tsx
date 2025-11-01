import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { addDoc, collection, db, getDocs, query, where } from '../../firebase';

interface UserDetail {
  id: string;
  age?: number;
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
  const [modalVisible, setModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [coverageDateFrom, setCoverageDateFrom] = useState<Date | null>(null);
  const [coverageDateTo, setCoverageDateTo] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [consumption, setConsumption] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | 'due' | null>(null);
  const [submittingBill, setSubmittingBill] = useState(false);

  const WATER_RATE_PER_CUBIC_METER = 20; // 20 pesos per cubic meter

  useEffect(() => {
    if (userId || email) {
      fetchUserDetail();
    }
  }, [userId, email]);

  // Auto-calculate total amount when consumption changes
  useEffect(() => {
    if (consumption) {
      const consumptionValue = parseFloat(consumption);
      if (!isNaN(consumptionValue) && consumptionValue > 0) {
        const calculatedTotal = consumptionValue * WATER_RATE_PER_CUBIC_METER;
        setTotalAmount(calculatedTotal.toFixed(2));
      } else {
        setTotalAmount('');
      }
    } else {
      setTotalAmount('');
    }
  }, [consumption]);

  const fetchUserDetail = async () => {
    try {
      const usersRef = collection(db, 'users');
      let q;

      if (userId) {
        // If we have userId, we could query by document ID, but Firestore doesn't support that directly
        // So we'll use email as fallback
        q = query(usersRef, where('email', '==', email));
      } else if (email) {
        q = query(usersRef, where('email', '==', email));
      } else {
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        setUserDetail({
          id: userDoc.id,
          age: userData.age,
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

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getMonthNumber = (monthName: string): number => {
    const index = months.findIndex(m => m === monthName);
    return index >= 0 ? index : new Date().getMonth();
  };

  const getDateInSelectedMonth = (monthName: string, day: number = 1): Date => {
    const now = new Date();
    const monthIndex = getMonthNumber(monthName);
    return new Date(now.getFullYear(), monthIndex, day);
  };

  const getLastDayOfMonth = (monthName: string): number => {
    const now = new Date();
    const monthIndex = getMonthNumber(monthName);
    return new Date(now.getFullYear(), monthIndex + 1, 0).getDate();
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setModalVisible(false);
    // Set default dates based on selected month
    const monthStartDate = getDateInSelectedMonth(month, 1);
    const lastDay = getLastDayOfMonth(month);
    const monthEndDate = getDateInSelectedMonth(month, lastDay);
    const monthMiddleDate = getDateInSelectedMonth(month, 15);
    
    setCoverageDateFrom(monthStartDate);
    setCoverageDateTo(monthEndDate);
    setDueDate(monthMiddleDate);
    setConsumption('');
    setTotalAmount('');
    setShowDatePicker(null);
    // Open form modal
    setFormModalVisible(true);
  };

  const handleSubmitBill = async () => {
    // Validate form fields
    if (!coverageDateFrom || !coverageDateTo || !dueDate || !consumption || !totalAmount) {
      alert('Please fill in all fields');
      return;
    }

    const consumptionValue = parseFloat(consumption);
    const amountValueFloat = parseFloat(totalAmount);

    // Validate the calculation
    const expectedAmount = consumptionValue * WATER_RATE_PER_CUBIC_METER;
    if (Math.abs(amountValueFloat - expectedAmount) > 0.01) {
      alert('Amount calculation mismatch. Please check the consumption value.');
      return;
    }

    if (!userDetail) {
      alert('User information not available');
      return;
    }

    setSubmittingBill(true);

    try {
      // Prepare bill data
      const billData = {
        userId: userDetail.id,
        userEmail: userDetail.email,
        userName: userDetail.fullName,
        meterNumber: userDetail.meterNumber || '',
        month: selectedMonth,
        coverageDateFrom: coverageDateFrom.toISOString(),
        coverageDateTo: coverageDateTo.toISOString(),
        dueDate: dueDate.toISOString(),
        consumption: consumptionValue,
        waterRatePerCubicMeter: WATER_RATE_PER_CUBIC_METER,
        totalAmount: amountValueFloat,
        status: 'unpaid', // Default status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore billing collection
      const billingRef = collection(db, 'billing');
      await addDoc(billingRef, billData);

      // Show success message
      alert('Bill created successfully!');

      // Close form and reset
      setFormModalVisible(false);
      setSelectedMonth('');
      setCoverageDateFrom(null);
      setCoverageDateTo(null);
      setDueDate(null);
      setConsumption('');
      setTotalAmount('');
      setShowDatePicker(null);
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Failed to save bill. Please try again.');
    } finally {
      setSubmittingBill(false);
    }
  };

  const handleCancelForm = () => {
    setFormModalVisible(false);
    setSelectedMonth('');
    setCoverageDateFrom(null);
    setCoverageDateTo(null);
    setDueDate(null);
    setConsumption('');
    setTotalAmount('');
    setShowDatePicker(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date, field: 'from' | 'to' | 'due' = 'from') => {
    const currentDate = selectedDate || new Date();

    if (Platform.OS === 'android') {
      setShowDatePicker(null);
      if (event.type === 'set') {
        if (field === 'from') {
          setCoverageDateFrom(currentDate);
        } else if (field === 'to') {
          setCoverageDateTo(currentDate);
        } else if (field === 'due') {
          setDueDate(currentDate);
        }
      }
    } else {
      // iOS
      if (field === 'from') {
        setCoverageDateFrom(currentDate);
      } else if (field === 'to') {
        setCoverageDateTo(currentDate);
      } else if (field === 'due') {
        setDueDate(currentDate);
      }
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
    monthsContainer: {
      paddingHorizontal: 20,
    },
    monthItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
    },
    monthText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '500',
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
            <Text style={styles.nameText}>{userDetail.fullName}</Text>
            <Text style={styles.roleText}>{userDetail.role}</Text>
          </View>

          {/* User Information */}
          <View style={styles.infoSection}>
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

            {userDetail.paymentStatus && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="card"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Payment Status</Text>
                  <View
                    style={[
                      styles.paymentStatusBadge,
                      userDetail.paymentStatus === 'paid'
                        ? styles.paymentPaid
                        : styles.paymentUnpaid,
                    ]}
                  >
                    <Text style={styles.paymentText}>
                      {userDetail.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

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

        {/* Add Bill Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addBillButton}
            onPress={() => setModalVisible(true)}
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

      {/* Month Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.monthsContainer}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.monthItem}
                  onPress={() => handleMonthSelect(month)}
                >
                  <Text style={styles.monthText}>{month}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

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
              <Text style={styles.formTitle}>Add Bill - {selectedMonth}</Text>
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
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Coverage Date From</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker('from')}
                >
                  <Text style={[
                    styles.dateInputText,
                    !coverageDateFrom && styles.dateInputPlaceholder
                  ]}>
                    {formatDateForDisplay(coverageDateFrom)}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </TouchableOpacity>
                {showDatePicker === 'from' && (
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
                          value={coverageDateFrom || (selectedMonth ? getDateInSelectedMonth(selectedMonth, 1) : new Date())}
                          mode="date"
                          display="spinner"
                          onChange={(event, date) => handleDateChange(event, date, 'from')}
                          textColor={Colors[colorScheme ?? 'light'].text}
                        />
                      </View>
                    )}
                    {Platform.OS === 'android' && (
                      <DateTimePicker
                        value={coverageDateFrom || (selectedMonth ? getDateInSelectedMonth(selectedMonth, 1) : new Date())}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          handleDateChange(event, date, 'from');
                          setShowDatePicker(null);
                        }}
                      />
                    )}
                  </>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Coverage Date To</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker('to')}
                >
                  <Text style={[
                    styles.dateInputText,
                    !coverageDateTo && styles.dateInputPlaceholder
                  ]}>
                    {formatDateForDisplay(coverageDateTo)}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors[colorScheme ?? 'light'].primary}
                  />
                </TouchableOpacity>
                {showDatePicker === 'to' && (
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
                          value={coverageDateTo || (selectedMonth ? getDateInSelectedMonth(selectedMonth, getLastDayOfMonth(selectedMonth)) : new Date())}
                          mode="date"
                          display="spinner"
                          onChange={(event, date) => handleDateChange(event, date, 'to')}
                          textColor={Colors[colorScheme ?? 'light'].text}
                        />
                      </View>
                    )}
                    {Platform.OS === 'android' && (
                      <DateTimePicker
                        value={coverageDateTo || (selectedMonth ? getDateInSelectedMonth(selectedMonth, getLastDayOfMonth(selectedMonth)) : new Date())}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          handleDateChange(event, date, 'to');
                          setShowDatePicker(null);
                        }}
                      />
                    )}
                  </>
                )}
              </View>

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
                          value={dueDate || (selectedMonth ? getDateInSelectedMonth(selectedMonth, 15) : new Date())}
                          mode="date"
                          display="spinner"
                          onChange={(event, date) => handleDateChange(event, date, 'due')}
                          textColor={Colors[colorScheme ?? 'light'].text}
                        />
                      </View>
                    )}
                    {Platform.OS === 'android' && (
                      <DateTimePicker
                        value={dueDate || (selectedMonth ? getDateInSelectedMonth(selectedMonth, 15) : new Date())}
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

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Consumption (cubic meters)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={consumption}
                  onChangeText={setConsumption}
                  keyboardType="decimal-pad"
                />
              </View>

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
                  Rate: ₱{WATER_RATE_PER_CUBIC_METER.toFixed(2)} per cubic meter
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
                style={[styles.submitButton, submittingBill && styles.disabledButton]}
                onPress={handleSubmitBill}
                disabled={submittingBill}
              >
                {submittingBill ? (
                  <View style={styles.submitButtonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.submitButtonSpinner} />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

