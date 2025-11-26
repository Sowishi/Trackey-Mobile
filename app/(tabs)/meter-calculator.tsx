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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, doc, getDoc, getDocs, query, where } from '../../firebase';

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

interface Bill {
  id: string;
  month: string;
  consumption: number;
  consumptionUsed?: number;
  previousConsumption?: number;
  createdAt: string;
}

export default function MeterCalculatorScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [currentReading, setCurrentReading] = useState('');
  const [lastReading, setLastReading] = useState<number | null>(null);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [waterRate, setWaterRate] = useState<number>(20.00);

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

  // Fetch latest bill to get last reading
  const fetchLatestBill = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const currentUserId = userId || await fetchUserId();
      if (!currentUserId) {
        setLoading(false);
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

      if (bills.length > 0) {
        // Sort by creation date (newest first)
        bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = bills[0];
        setLatestBill(latest);
        
        // Calculate last reading:
        // - If previousConsumption exists, that's the last reading
        // - Otherwise, if consumptionUsed exists, last reading = consumption - consumptionUsed
        // - Otherwise, use consumption as the current reading (last reading would be 0 or unknown)
        if (latest.previousConsumption !== undefined && latest.previousConsumption !== null) {
          setLastReading(latest.previousConsumption);
        } else if (latest.consumptionUsed !== undefined && latest.consumptionUsed !== null) {
          // Last reading = current reading - consumption used
          setLastReading(latest.consumption - latest.consumptionUsed);
        } else {
          // If we only have consumption, we can't determine last reading accurately
          // Use consumption as current reading, but this means last reading is unknown
          setLastReading(null);
        }
      }
    } catch (error) {
      console.error('Error fetching latest bill:', error);
      Alert.alert('Error', 'Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch water rate on component mount
    fetchWaterRate().then(rate => {
      setWaterRate(rate);
    });
    
    fetchUserId().then(() => {
      fetchLatestBill();
    });
  }, [user]);

  useEffect(() => {
    if (userId) {
      fetchLatestBill();
    }
  }, [userId]);

  const calculateConsumption = (): number => {
    if (!currentReading || !lastReading) return 0;
    const current = parseFloat(currentReading);
    const last = lastReading;
    if (isNaN(current) || current < last) return 0;
    return current - last;
  };

  const calculatePrice = (): number => {
    const consumption = calculateConsumption();
    return consumption * waterRate;
  };

  const handleCalculate = () => {
    if (!currentReading) {
      Alert.alert('Validation Error', 'Please enter current meter reading');
      return;
    }

    const current = parseFloat(currentReading);
    if (isNaN(current)) {
      Alert.alert('Validation Error', 'Please enter a valid number');
      return;
    }

    if (lastReading !== null && current < lastReading) {
      Alert.alert('Validation Error', 'Current reading cannot be less than last reading');
      return;
    }

    const consumption = calculateConsumption();
    const price = calculatePrice();

    Alert.alert(
      'Calculation Result',
      `Consumption: ${consumption.toFixed(2)} m³\nEstimated Price: ₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      [{ text: 'OK' }]
    );
  };

  const consumption = calculateConsumption();
  const price = calculatePrice();

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
      marginBottom: 24,
    },
    card: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    readingDisplay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      marginBottom: 12,
    },
    readingLabel: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
    },
    readingValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    resultCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 12,
      padding: 20,
      marginTop: 20,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 16,
      textAlign: 'center',
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    resultLabel: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.7,
    },
    resultValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    priceValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    calculateButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    calculateButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
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
    infoText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.5,
      marginTop: 8,
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="Meter Calculator" 
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading meter information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title="Meter Calculator" 
        onBackPress={() => router.back()}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Water Meter Calculator</Text>
        <Text style={styles.subtitle}>
          Enter your current meter reading to calculate your water consumption and estimated bill
        </Text>

        {/* Last Reading Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last Meter Reading</Text>
          <View style={styles.readingDisplay}>
            <Text style={styles.readingLabel}>Previous Reading</Text>
            <Text style={styles.readingValue}>
              {lastReading !== null ? `${lastReading.toFixed(2)} m³` : 'N/A'}
            </Text>
          </View>
          {latestBill && (
            <Text style={styles.infoText}>
              From: {latestBill.month}
            </Text>
          )}
        </View>

        {/* Current Reading Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Meter Reading</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter Current Reading (m³)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={currentReading}
              onChangeText={setCurrentReading}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Calculation Results */}
        {currentReading && !isNaN(parseFloat(currentReading)) && consumption > 0 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Calculation Result</Text>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Last Reading:</Text>
              <Text style={styles.resultValue}>
                {lastReading !== null ? `${lastReading.toFixed(2)} m³` : 'N/A'}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Current Reading:</Text>
              <Text style={styles.resultValue}>
                {parseFloat(currentReading).toFixed(2)} m³
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Consumption:</Text>
              <Text style={styles.resultValue}>
                {consumption.toFixed(2)} m³
              </Text>
            </View>

            <View style={[styles.resultRow, { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors[colorScheme ?? 'light'].border }]}>
              <Text style={styles.resultLabel}>Estimated Price:</Text>
              <Text style={styles.priceValue}>
                ₱{price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            <Text style={styles.infoText}>
              Rate: ₱{waterRate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per cubic meter
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleCalculate}
          disabled={!currentReading || isNaN(parseFloat(currentReading))}
        >
          <Ionicons name="calculator" size={24} color="#FFFFFF" />
          <Text style={styles.calculateButtonText}>Calculate</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

