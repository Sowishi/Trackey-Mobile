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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function ReceiptScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const receiptRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);

  // Parse bill data from params
  const billData = params.billData ? JSON.parse(params.billData as string) : null;

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
            <Text style={styles.receiptTitle}>WATER BILL RECEIPT</Text>
            <Text style={styles.receiptSubtitle}>AquaBill Billing System</Text>
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
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Consumption:</Text>
              <Text style={styles.receiptValue}>{billData.consumption} cubic meters</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Rate per m³:</Text>
              <Text style={styles.receiptValue}>₱{billData.waterRatePerCubicMeter.toFixed(2)}</Text>
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
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₱{billData.totalAmount.toFixed(2)}</Text>
            </View>
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

