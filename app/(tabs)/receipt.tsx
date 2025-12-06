import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { db, doc, getDoc } from '../../firebase';

export default function ReceiptScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const receiptRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);
  const [waterRate, setWaterRate] = useState<number>(20.00);
  const [printers, setPrinters] = useState<string[]>([]);
  const [currentPrinter, setCurrentPrinter] = useState('10:22:33:D7:05:DE');

  // Parse bill data from params
  const billData = params.billData ? JSON.parse(params.billData as string) : null;

  // Fetch water rate from Firestore settings (same logic as dashboard)
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
    // Request media library permissions
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Media library permission not granted');
        }
      }
    })();

    // Fetch water rate
    const loadWaterRate = async () => {
      const rate = await fetchWaterRate();
      setWaterRate(rate);
    };
    loadWaterRate();
  }, []);

  const formatDate = (dateString: string) => {
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

  const scanDevice = async () => {
    try {
      const text = 
        '\x1B\x40' +          // Initialize printer
        '\x1B\x61\x01' +      // Center alignment for "Water Bill Notice" and "Thank you for trusting"
        ' WATER BILL NOTICE \n' +
        ' Magahis III West Water System \n' + // Added address
        ' Tuy, Batangas 4214 \n' + // Added address
        '\x1B\x61\x01' +      // Center alignment for the line
        '__________________________\n' + // Centered line
        '\x1B\x61\x00' +      // Left alignment for customer information and bill details
        ' Customer Information \n' +
        '\x1B\x61\x00' +      // Left alignment for customer information details
        'Name: ' + billData.userName + '\n' +
        'Email: ' + billData.userEmail + '\n' +
        (billData.meterNumber ? 'Meter Number: ' + billData.meterNumber + '\n' : '') +
        '\x1B\x61\x01' +      // Center alignment for the line
        '__________________________\n' + // Centered line
        '\x1B\x61\x01' +      // Center alignment for "Billing Period" section
        ' Billing Period \n' +
        '\x1B\x61\x00' +      // Left alignment for the billing period details
        'Month: ' + billData.month + '\n' +
        'Coverage Period: ' + formatDate(billData.coverageDateFrom) + ' - ' + formatDate(billData.coverageDateTo) + '\n' +
        'Due Date: ' + formatDate(billData.dueDate) + '\n' +
        '\x1B\x61\x01' +      // Center alignment for the line
        '__________________________\n' + // Centered line
        '\x1B\x61\x01' +      // Center alignment for "Bill Details" section
        ' Bill Details \n' +
        '\x1B\x61\x00' +      // Left alignment for bill details
        (billData.previousConsumption !== undefined ? 'Previous Consumption: ' + billData.previousConsumption + ' \n' : '') +
        'Present Consumption: ' + billData.consumption + ' \n' +
        (billData.consumptionUsed !== undefined ? 'Consumption Used: ' + billData.consumptionUsed.toFixed(2) + ' \n' : '') +
        'Rate per m3: ' + waterRate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\n' +
        'Status: ' + (billData.status === 'paid' ? 'Paid' : 'Unpaid') + '\n' +
        '\x1B\x61\x01' +      // Center alignment for the line
        '__________________________\n' + // Centered line
        '\x1B\x61\x01' +      // Center alignment for total amount section
        ' \n' +
        '\x1B\x61\x00' +      // Left alignment for total amount value
        'Total Amount: ' + '' + billData.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\n' +
        '\n' +
        '\x1B\x61\x01' +      // Center alignment for "Paalala"
        ' Paalala \n' +       // Centered "Paalala"
        '\x1B\x61\x00' +      // Left alignment for the new message
        ' * Mangyaring bayaran agad ang halagang nakasaad sa Water Bill Notice upang maiwasan ang agarang pagputol ng inyong serbisyo sa tubig nang walang karagdagang abiso. Maaari nang balewalain ang paalalang ito kung nakapagbayad na sa takdang oras. \n' +
        '\n' +
        '\x1B\x61\x01' +      // Center alignment for "Thank you" message
        'Thank you for trusting Aqua-Bill\n' + // Footer message
        '\n\n\n' +           // Feed lines
        '\x1D\x56\x41\x03';  // Cut paper

      const printParams = new URLSearchParams();
      printParams.append('content', text);
      printParams.append('encode_format', 'UTF-8');
      printParams.append('device_address', currentPrinter);

      // Use custom scheme (recommended)
      const printUrl = `btprinter://print?${printParams.toString()};`;
      console.log(printUrl, 'printUrl');
      await Linking.openURL(printUrl);
      Alert.alert('Success', 'Print command sent successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send print command');
    }
  };

  const handleSaveReceipt = async () => {
    if (!receiptRef.current) return;

    setSaving(true);
    try {
      const uri = await captureRef(receiptRef.current, {
        format: 'png',
        quality: 1,
      });

      if (Platform.OS !== 'web') {
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('AquaBill', asset, false);
        Alert.alert('Success', 'Receipt saved to gallery!');
      } else {
        Alert.alert('Info', 'Receipt captured (download functionality on web requires additional setup)');
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    receiptContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    receiptHeader: {
      alignItems: 'center',
      marginBottom: 24,
      borderBottomWidth: 2,
      borderBottomColor: Colors[colorScheme ?? 'light'].primary,
      paddingBottom: 20,
    },
    logo: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
      marginBottom: 16,
    },
    receiptTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
      marginBottom: 8,
    },
    receiptSubtitle: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
    },
    receiptSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
      paddingBottom: 8,
    },
    receiptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    receiptLabel: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
    },
    receiptValue: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
    },
    receiptDivider: {
      height: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].border,
      marginVertical: 16,
    },
    totalSection: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 8,
      padding: 16,
      marginTop: 8,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    totalValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusPaid: {
      backgroundColor: '#D1FAE5',
    },
    statusUnpaid: {
      backgroundColor: '#FEE2E2',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    footer: {
      alignItems: 'center',
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme ?? 'light'].border,
    },
    footerText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
      marginTop: 8,
    },
    actionButton: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    saveButtonInReceipt: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      marginTop: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    saveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: {
      color: Colors[colorScheme ?? 'light'].primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  if (!billData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="Receipt" 
          onUserPress={() => router.push('/(tabs)/profile')}
        />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={Colors[colorScheme ?? 'light'].icon}
          />
          <Text style={{ marginTop: 16, fontSize: 16, color: Colors[colorScheme ?? 'light'].text }}>
            No receipt data available
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { position: 'relative', marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.actionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title="Receipt" 
        onUserPress={() => router.push('/(tabs)/profile')}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View ref={receiptRef} style={styles.receiptContainer} collapsable={false}>
          {/* Header with Logo */}
          <View style={styles.receiptHeader}>
            <Image 
              source={require('../../assets/images/aquabill-logo.png')}
              style={styles.logo}
            />
            <Text style={styles.receiptTitle}>BILLING NOTICE</Text>
            <Text style={styles.receiptSubtitle}>Magahis III West Water System Tuy, Batangas 4214</Text>
          </View>

          {/* Customer Information */}
          <View style={styles.receiptSection}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Name:</Text>
              <Text style={styles.receiptValue}>{billData.userName}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Email:</Text>
              <Text style={styles.receiptValue}>{billData.userEmail}</Text>
            </View>
            {billData.meterNumber && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Meter Number:</Text>
                <Text style={styles.receiptValue}>{billData.meterNumber}</Text>
              </View>
            )}
          </View>

          <View style={styles.receiptDivider} />

          {/* Billing Period */}
          <View style={styles.receiptSection}>
            <Text style={styles.sectionTitle}>Billing Period</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Month:</Text>
              <Text style={styles.receiptValue}>{billData.month}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Coverage Period:</Text>
              <Text style={styles.receiptValue}>
                {formatDate(billData.coverageDateFrom)} - {formatDate(billData.coverageDateTo)}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Due Date:</Text>
              <Text style={styles.receiptValue}>{formatDate(billData.dueDate)}</Text>
            </View>
          </View>

          <View style={styles.receiptDivider} />

          {/* Bill Details */}
          <View style={styles.receiptSection}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            {billData.previousConsumption !== undefined && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Previous Consumption:</Text>
                <Text style={styles.receiptValue}>{billData.previousConsumption} </Text>
              </View>
            )}
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Present Consumption:</Text>
              <Text style={styles.receiptValue}>{billData.consumption} </Text>
            </View>
            {billData.consumptionUsed !== undefined && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Consumption Used:</Text>
                <Text style={styles.receiptValue}>{billData.consumptionUsed.toFixed(2)} </Text>
              </View>
            )}
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Rate per m³:</Text>
              <Text style={styles.receiptValue}>₱{waterRate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                billData.status === 'paid' ? styles.statusPaid : styles.statusUnpaid
              ]}>
                <Text style={styles.statusText}>
                  {billData.status === 'paid' ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.receiptDivider} />

          {/* Total Amount */}
          <View style={styles.totalSection}>
            {(() => {
              // Copy penalty calculation logic from billing-information.tsx
              const baseAmount = billData.totalAmount || 0;
              
              // Check if bill was overdue - same logic as billing-information.tsx
              const isOverdue = billData.dueDate && new Date(billData.dueDate) < new Date();
              const penalty = isOverdue ? 30 : 0;
              const totalAmount = baseAmount + penalty;
              
              // Show penalty if it exists
              const shouldShowPenalty = penalty > 0;

              return (
                <>
                  {shouldShowPenalty && penalty > 0 ? (
                    <>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>₱{baseAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Penalty (Overdue):</Text>
                        <Text style={[styles.totalValue, { color: '#DC2626', fontSize: 18 }]}>₱{penalty.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                      <View style={[styles.totalRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors[colorScheme ?? 'light'].border }]}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalValue}>₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Amount:</Text>
                      <Text style={styles.totalValue}>₱{baseAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Generated on {new Date(billData.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.footerText}>
              Thank you for using AquaBill!
            </Text>
          </View>
        </View>

        {/* Save Button inside scroll */}
        <TouchableOpacity
          style={styles.saveButtonInReceipt}
          onPress={handleSaveReceipt}
          disabled={saving}
        >
          {saving ? (
            <View style={styles.saveButtonContent}>
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <View style={styles.saveButtonContent}>
              <Ionicons name="download" size={24} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={styles.saveButtonText}>Save to Gallery</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Print Button */}
        <TouchableOpacity
          style={styles.saveButtonInReceipt}
          onPress={() => scanDevice()}
        >
          <View style={styles.saveButtonContent}>
            <Ionicons name="print" size={24} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={styles.saveButtonText}>Print</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleSaveReceipt}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="download" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Save to Gallery</Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

