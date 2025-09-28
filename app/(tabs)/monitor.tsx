import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { database, off, onValue, ref } from '@/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width, height } = Dimensions.get('window');

interface EnergySource {
  id: string;
  name: string;
  icon: string;
  color: string;
  amps: number;
  volts: number;
  watts: number;
  efficiency: number;
  status: 'active' | 'inactive' | 'maintenance';
}

interface EnergyMonitorData {
  solar: EnergySource;
  wind: EnergySource;
  gutter: EnergySource;
  totalOutput: number;
  batteryLevel: number;
  gridConnection: boolean;
  lastUpdate: string;
}

export default function MonitorScreen() {
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEnergySource, setSelectedEnergySource] = useState<EnergySource | null>(null);
  const [energyData, setEnergyData] = useState<EnergyMonitorData>({
    solar: {
      id: 'solar',
      name: 'Solar Panel',
      icon: 'sunny',
      color: '#FFD700',
      amps: 0,
      volts: 0,
      watts: 0,
      efficiency: 85,
      status: 'active'
    },
    wind: {
      id: 'wind',
      name: 'Wind Turbine',
      icon: 'leaf',
      color: '#4CAF50',
      amps: 0,
      volts: 0,
      watts: 0,
      efficiency: 78,
      status: 'active'
    },
    gutter: {
      id: 'gutter',
      name: 'Gutter Turbine',
      icon: 'water',
      color: '#2196F3',
      amps: 0,
      volts: 0,
      watts: 0,
      efficiency: 45,
      status: 'active'
    },
    totalOutput: 0,
    batteryLevel: 87,
    gridConnection: true,
    lastUpdate: new Date().toLocaleTimeString()
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const energyBallAnim = useRef(new Animated.Value(0)).current;
  const housePulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();

    // Pulsing animation for status indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Glowing animation for energy flow
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();

    // Energy ball animation traveling along the lines
    const energyBallAnimation = Animated.loop(
      Animated.timing(energyBallAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    );
    energyBallAnimation.start();

    // House pulsing animation
    const housePulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(housePulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(housePulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    housePulseAnimation.start();

    // Firebase Real-time Database Listeners
    const setupFirebaseListeners = () => {
      // Gutter data listeners
      const gutterAmpsRef = ref(database, '/BNHS-Watch/renewable/gutter/amps');
      const gutterVoltRef = ref(database, '/BNHS-Watch/renewable/gutter/volt');
      const gutterWattRef = ref(database, '/BNHS-Watch/renewable/gutter/watt');

      // Wind data listeners
      const windAmpsRef = ref(database, '/BNHS-Watch/renewable/wind/amps');
      const windVoltRef = ref(database, '/BNHS-Watch/renewable/wind/volt');
      const windWattRef = ref(database, '/BNHS-Watch/renewable/wind/watt');

      // Solar data listeners
      const solarAmpsRef = ref(database, '/BNHS-Watch/renewable/solar/amps');
      const solarVoltRef = ref(database, '/BNHS-Watch/renewable/solar/volt');
      const solarWattRef = ref(database, '/BNHS-Watch/renewable/solar/watt');

      // Gutter listeners
      onValue(gutterAmpsRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            gutter: { ...prev.gutter, amps: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      onValue(gutterVoltRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            gutter: { ...prev.gutter, volts: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      onValue(gutterWattRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            gutter: { ...prev.gutter, watts: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      // Wind listeners
      onValue(windAmpsRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            wind: { ...prev.wind, amps: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      onValue(windVoltRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            wind: { ...prev.wind, volts: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      onValue(windWattRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            wind: { ...prev.wind, watts: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      // Solar listeners
      onValue(solarAmpsRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            solar: { ...prev.solar, amps: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      onValue(solarVoltRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            solar: { ...prev.solar, volts: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      onValue(solarWattRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
          setEnergyData(prev => ({
            ...prev,
            solar: { ...prev.solar, watts: parseFloat(value) || 0 },
            lastUpdate: new Date().toLocaleTimeString()
          }));
        }
      });

      return {
        gutterAmpsRef,
        gutterVoltRef,
        gutterWattRef,
        windAmpsRef,
        windVoltRef,
        windWattRef,
        solarAmpsRef,
        solarVoltRef,
        solarWattRef
      };
    };

    const firebaseRefs = setupFirebaseListeners();

    // Calculate total output whenever individual values change
    const calculateTotalOutput = () => {
      setEnergyData(prev => ({
        ...prev,
        totalOutput: prev.solar.watts + prev.wind.watts + prev.gutter.watts
      }));
    };

    // Update total output every second
    const totalOutputInterval = setInterval(calculateTotalOutput, 1000);

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      // Clean up Firebase listeners
      off(firebaseRefs.gutterAmpsRef);
      off(firebaseRefs.gutterVoltRef);
      off(firebaseRefs.gutterWattRef);
      off(firebaseRefs.windAmpsRef);
      off(firebaseRefs.windVoltRef);
      off(firebaseRefs.windWattRef);
      off(firebaseRefs.solarAmpsRef);
      off(firebaseRefs.solarVoltRef);
      off(firebaseRefs.solarWattRef);
      
      // Clean up intervals and animations
      clearInterval(totalOutputInterval);
      pulseAnimation.stop();
      glowAnimation.stop();
      energyBallAnimation.stop();
      housePulseAnimation.stop();
    };
  }, []);

  // Handle energy source click with animation
  const handleEnergySourcePress = (source: EnergySource) => {
    // Scale animation for visual feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedEnergySource(source);
    setModalVisible(true);
  };

  // Handle press in animation
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Handle press out animation
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedEnergySource(null);
  };

  // Get additional statistics for energy source
  const getAdditionalStats = (source: EnergySource) => {
    const power = source.watts;
    const dailyProduction = (power * 8).toFixed(1); // Assuming 8 hours of production
    const monthlyProduction = (parseFloat(dailyProduction) * 30).toFixed(1);
    const carbonOffset = (power * 0.0005 * 24).toFixed(2); // kg CO2 per day
    const costSavings = (power * 0.12 * 24 / 1000).toFixed(2); // $ per day at $0.12/kWh
    
    return {
      dailyProduction,
      monthlyProduction,
      carbonOffset,
      costSavings,
      powerFactor: (source.efficiency / 100).toFixed(2),
      temperature: `${Math.floor(Math.random() * 20) + 25}°C`,
    };
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      paddingBottom: 50,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    header: {
      marginBottom: 20,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerIcon: {
      marginRight: 12,
    },
    subtitle: {
      opacity: 0.7,
      fontSize: 14,
    },
    scrollView: {
      flex: 1,
    },
    // Energy Monitor Styles - Single Line Layout
    energyContainer: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    energySourcesRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginBottom: 120,
      gap: 40,
    },
    energySource: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 70,
      height: 70,
      borderRadius: 40,
      borderWidth: 3,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    energySourcePressed: {
      elevation: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    energyIcon: {
    },
    energyName: {
      fontSize: 10,
      fontWeight: '500',
      textAlign: 'center',
      opacity: 0.7,
      position: 'absolute',
      bottom: -25,
      width: 60,
    },
    houseContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].tint,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      marginTop: 100,
    },
    svgContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    },
     // Statistics Section Styles
     statisticsContainer: {
       paddingHorizontal: 20,
       paddingTop: 30,
       paddingBottom: 20,
     },
     totalOutputCard: {
       backgroundColor: Colors[colorScheme ?? 'light'].background,
       borderRadius: 16,
       padding: 20,
       marginBottom: 20,
       borderWidth: 2,
       borderColor: '#FFD700' + '40',
       elevation: 4,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.1,
       shadowRadius: 8,
     },
     totalOutputHeader: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 10,
     },
     totalOutputValue: {
       fontSize: 32,
       fontWeight: 'bold',
       color: '#FFD700',
       marginBottom: 5,
       textAlign: 'center',
     },
     totalOutputLabel: {
       fontSize: 16,
       fontWeight: '600',
       marginLeft: 8,
       color: Colors[colorScheme ?? 'light'].text,
     },
     lastUpdateText: {
       fontSize: 12,
       opacity: 0.6,
       textAlign: 'center',
       marginTop: 5,
     },
     sectionTitle: {
       fontSize: 18,
       fontWeight: 'bold',
       marginBottom: 15,
       color: Colors[colorScheme ?? 'light'].text,
     },
     energySourcesGrid: {
       marginBottom: 25,
     },
     sourceCard: {
       backgroundColor: Colors[colorScheme ?? 'light'].background,
       borderRadius: 12,
       padding: 15,
       marginBottom: 12,
       borderLeftWidth: 4,
       elevation: 2,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 1 },
       shadowOpacity: 0.1,
       shadowRadius: 4,
     },
     sourceHeader: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 8,
     },
     sourceTitle: {
       fontSize: 14,
       fontWeight: '600',
       marginLeft: 8,
       color: Colors[colorScheme ?? 'light'].text,
     },
     sourceValue: {
       fontSize: 20,
       fontWeight: 'bold',
       marginBottom: 4,
     },
     sourceSubtext: {
       fontSize: 12,
       opacity: 0.7,
       marginBottom: 8,
       color: Colors[colorScheme ?? 'light'].text,
     },
     contributionBar: {
       height: 4,
       backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
       borderRadius: 2,
       overflow: 'hidden',
     },
     contributionFill: {
       height: '100%',
       borderRadius: 2,
     },
     metricsContainer: {
       marginBottom: 25,
     },
     metricsGrid: {
       flexDirection: 'row',
       flexWrap: 'wrap',
       justifyContent: 'space-between',
     },
     metricCard: {
       backgroundColor: Colors[colorScheme ?? 'light'].background,
       borderRadius: 12,
       padding: 15,
       width: '48%',
       marginBottom: 12,
       alignItems: 'center',
       elevation: 2,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 1 },
       shadowOpacity: 0.1,
       shadowRadius: 4,
     },
     metricValue: {
       fontSize: 16,
       fontWeight: 'bold',
       marginTop: 8,
       marginBottom: 4,
       color: Colors[colorScheme ?? 'light'].text,
     },
     metricLabel: {
       fontSize: 12,
       opacity: 0.7,
       textAlign: 'center',
       color: Colors[colorScheme ?? 'light'].text,
     },
     statusContainer: {
       marginBottom: 20,
     },
     statusGrid: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       flexWrap: 'wrap',
     },
     statusItem: {
       backgroundColor: Colors[colorScheme ?? 'light'].background,
       borderRadius: 12,
       padding: 15,
       width: '32%',
       alignItems: 'center',
       elevation: 2,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 1 },
       shadowOpacity: 0.1,
       shadowRadius: 4,
     },
     statusIndicator: {
       width: 12,
       height: 12,
       borderRadius: 6,
       marginBottom: 8,
     },
     statusLabel: {
       fontSize: 11,
       opacity: 0.7,
       textAlign: 'center',
       marginBottom: 4,
       color: Colors[colorScheme ?? 'light'].text,
     },
     statusValue: {
       fontSize: 12,
       fontWeight: '600',
       textAlign: 'center',
       color: Colors[colorScheme ?? 'light'].text,
     },
    batterySection: {
      backgroundColor: '#2A2A2A',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
    },
    batteryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    batteryIcon: {
      marginRight: 8,
    },
    batteryLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    batteryLevel: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#4CAF50',
      marginBottom: 8,
    },
    batteryBar: {
      height: 8,
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
      borderRadius: 4,
      overflow: 'hidden',
    },
    batteryFill: {
      height: '100%',
      borderRadius: 4,
    },
    refreshButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      borderRadius: 50,
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    loadingContainer: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#333333',
      borderRadius: 16,
    },
    loadingText: {
      marginTop: 12,
      opacity: 0.7,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
    },
    modalTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalTitleText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 10,
      color: Colors[colorScheme ?? 'light'].text,
    },
    closeButton: {
      padding: 5,
    },
    statsContainer: {
      marginBottom: 20,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 15,
      marginHorizontal: 5,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 12,
      opacity: 0.7,
      textAlign: 'center',
    },
    additionalStats: {
      marginTop: 10,
    },
    additionalStatItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    additionalStatLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    additionalStatValue: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      alignSelf: 'flex-start',
      marginTop: 10,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });

  // Enhanced Clickable Energy Source Component
  const renderEnergySource = (source: EnergySource) => (
    <TouchableOpacity
      key={source.id}
      onPress={() => handleEnergySourcePress(source)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Animated.View 
        style={[
          styles.energySource,
          {
            borderColor: source.color,
            opacity: fadeAnim,
            shadowColor: source.color,
          }
        ]}
      >
        <Ionicons 
          name={source.icon as any} 
          size={28} 
          color={source.color}
          style={styles.energyIcon}
        />
        <ThemedText style={[styles.energyName, { color: Colors[colorScheme ?? 'light'].text }]}>
          {source.name}
        </ThemedText>
        
        {/* Subtle glow effect indicator */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 84,
            height: 84,
            borderRadius: 42,
            borderWidth: 2,
            borderColor: source.color,
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.3],
              outputRange: [0.3, 0.6],
            }),
            transform: [{ scale: pulseAnim }],
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );

  // SVG Connection Lines Component
  const renderConnectionLines = () => {
    // Calculate exact positions to match the actual element centers
    const centerX = width * 0.45;
    const gap = 120;
    
    // Energy source positions (accounting for circle centers)
    const solarX = centerX - gap;
    const windX = centerX;
    const gutterX = centerX + gap;
    const sourceY = 120; // Adjusted to match actual circle center position
    
    // House position (accounting for house container center + margin top)
    const houseX = width * 0.45;
    const houseY = 380; // Adjusted to match actual house center position
    
    // Create curved path for each connection
    const createCurvedPath = (startX: number, startY: number, endX: number, endY: number) => {
      const midY = startY + (endY - startY) * .5;
      const controlX1 = startX + (endX - startX) * 0.2;
      const controlY1 = midY;
      const controlX2 = endX + (startX - endX) * 0.2;
      const controlY2 = midY;
      
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    };

    // Calculate energy ball position along curve
    const getEnergyBallPosition = (startX: number, startY: number, endX: number, endY: number, t: number) => {
      const midY = startY + (endY - startY) * .5;
      const controlX1 = startX + (endX - startX) * 0.2;
      const controlY1 = midY;
      const controlX2 = endX + (startX - endX) * 0.2;
      const controlY2 = midY;
      
      // Cubic Bezier curve calculation
      const x = Math.pow(1 - t, 3) * startX + 
                3 * Math.pow(1 - t, 2) * t * controlX1 + 
                3 * (1 - t) * Math.pow(t, 2) * controlX2 + 
                Math.pow(t, 3) * endX;
      
      const y = Math.pow(1 - t, 3) * startY + 
                3 * Math.pow(1 - t, 2) * t * controlY1 + 
                3 * (1 - t) * Math.pow(t, 2) * controlY2 + 
                Math.pow(t, 3) * endY;
      
      return { x, y };
    };

    return (
      <Svg height={height} width={width} style={styles.svgContainer}>
        <Defs>
          {/* Glowing gradient definition */}
          <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF8C00" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        
        {/* Base curved lines (always visible) */}
        <Path
          d={createCurvedPath(solarX, sourceY, houseX, houseY)}
          stroke="#FF8C00"
          strokeWidth="2"
          fill="none"
          strokeOpacity="0.4"
        />
        
        <Path
          d={createCurvedPath(windX, sourceY, houseX, houseY)}
          stroke="#FF8C00"
          strokeWidth="2"
          fill="none"
          strokeOpacity="0.4"
        />
        
        <Path
          d={createCurvedPath(gutterX, sourceY, houseX, houseY)}
          stroke="#FF8C00"
          strokeWidth="2"
          fill="none"
          strokeOpacity="0.4"
        />
        
        {/* Glowing animated lines */}
        <AnimatedPath
          d={createCurvedPath(solarX, sourceY, houseX, houseY)}
          stroke="url(#glowGradient)"
          strokeWidth="6"
          fill="none"
          strokeOpacity={glowAnim}
          strokeLinecap="round"
        />
        
        <AnimatedPath
          d={createCurvedPath(windX, sourceY, houseX, houseY)}
          stroke="url(#glowGradient)"
          strokeWidth="6"
          fill="none"
          strokeOpacity={glowAnim}
          strokeLinecap="round"
        />
        
        <AnimatedPath
          d={createCurvedPath(gutterX, sourceY, houseX, houseY)}
          stroke="url(#glowGradient)"
          strokeWidth="6"
          fill="none"
          strokeOpacity={glowAnim}
          strokeLinecap="round"
        />
        
        {/* Connection dots at energy sources */}
        <Circle
          cx={solarX}
          cy={sourceY}
          r="4"
          fill={energyData.solar.color}
        />
        
        <Circle
          cx={windX}
          cy={sourceY}
          r="4"
          fill={energyData.wind.color}
        />
        
        <Circle
          cx={gutterX}
          cy={sourceY}
          r="4"
          fill={energyData.gutter.color}
        />
        
        {/* Glowing connection dot at house */}
        <AnimatedCircle
          cx={houseX}
          cy={houseY}
          r="8"
          fill="#FF8C00"
          fillOpacity={glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1]
          })}
        />
        
        {/* Inner house connection dot */}
        <Circle
          cx={houseX}
          cy={houseY}
          r="4"
          fill="#FFD700"
        />

        {/* Energy balls traveling along the lines */}
        <AnimatedCircle
          cx={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [solarX, houseX]
          })}
          cy={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [sourceY, houseY]
          })}
          r="6"
          fill="#FFD700"
          fillOpacity="0.9"
        />
        <AnimatedCircle
          cx={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [solarX, houseX]
          })}
          cy={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [sourceY, houseY]
          })}
          r="3"
          fill="#FFFFFF"
          fillOpacity="0.8"
        />
        
        {/* Wind energy ball */}
        <AnimatedCircle
          cx={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [windX, houseX]
          })}
          cy={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [sourceY, houseY]
          })}
          r="6"
          fill="#FFD700"
          fillOpacity="0.9"
        />
        <AnimatedCircle
          cx={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [windX, houseX]
          })}
          cy={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [sourceY, houseY]
          })}
          r="3"
          fill="#FFFFFF"
          fillOpacity="0.8"
        />
        
        {/* Gutter energy ball */}
        <AnimatedCircle
          cx={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [gutterX, houseX]
          })}
          cy={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [sourceY, houseY]
          })}
          r="6"
          fill="#FFD700"
          fillOpacity="0.9"
        />
        <AnimatedCircle
          cx={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [gutterX, houseX]
          })}
          cy={energyBallAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [sourceY, houseY]
          })}
          r="3"
          fill="#FFFFFF"
          fillOpacity="0.8"
        />
      </Svg>
    );
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.titleRow}>
            <Ionicons 
              name="flash" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">Energy Monitor</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Real-time renewable energy monitoring • Solar • Wind • Hydro
          </ThemedText>
        </Animated.View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        

          {/* Energy Sources Layout */}
          <View style={styles.energyContainer}>
            {/* Connection Lines */}
            {renderConnectionLines()}
            
            {/* All Energy Sources in One Row */}
            <View style={styles.energySourcesRow}>
              {renderEnergySource(energyData.solar)}
              {renderEnergySource(energyData.wind)}
              {renderEnergySource(energyData.gutter)}
                </View>

             {/* House Icon */}
           <Animated.View 
             style={[
                 styles.houseContainer,
               {
                 opacity: fadeAnim,
                 transform: [{ scale: housePulseAnim }],
               }
             ]}
           >
               <Ionicons 
                 name="home" 
                 size={40} 
                 color={Colors[colorScheme ?? 'light'].tint}
               />
             </Animated.View>
             </View>

           {/* Statistics Section */}
           <Animated.View 
             style={[
               styles.statisticsContainer,
               {
                 opacity: fadeAnim,
                 transform: [{ translateY: slideAnim }]
               }
             ]}
           >
             {/* Total Output Card */}
             <View style={styles.totalOutputCard}>
               <View style={styles.totalOutputHeader}>
                 <Ionicons name="flash" size={24} color="#FFD700" />
                 <ThemedText style={styles.totalOutputLabel}>Total Power Output</ThemedText>
               </View>
               <ThemedText style={styles.totalOutputValue}>
                 {energyData.totalOutput.toFixed(1)} W
               </ThemedText>
               <ThemedText style={styles.lastUpdateText}>
                 Last updated: {energyData.lastUpdate}
               </ThemedText>
             </View>

             {/* Energy Sources Grid */}
             <View style={styles.energySourcesGrid}>
               <View style={[styles.sourceCard, { borderLeftColor: energyData.solar.color }]}>
                 <View style={styles.sourceHeader}>
                   <Ionicons name={energyData.solar.icon as any} size={20} color={energyData.solar.color} />
                   <ThemedText style={styles.sourceTitle}>Solar</ThemedText>
                 </View>
                 <ThemedText style={[styles.sourceValue, { color: energyData.solar.color }]}>
                   {energyData.solar.watts.toFixed(1)}W
                 </ThemedText>
                 <ThemedText style={styles.sourceSubtext}>
                   {energyData.solar.amps.toFixed(1)}A • {energyData.solar.volts.toFixed(1)}V
                 </ThemedText>
                 <View style={styles.contributionBar}>
                   <View 
                     style={[
                       styles.contributionFill, 
                       { 
                         backgroundColor: energyData.solar.color,
                         width: `${energyData.totalOutput > 0 ? (energyData.solar.watts / energyData.totalOutput) * 100 : 0}%`
                       }
                     ]} 
                   />
                 </View>
               </View>

               <View style={[styles.sourceCard, { borderLeftColor: energyData.wind.color }]}>
                 <View style={styles.sourceHeader}>
                   <Ionicons name={energyData.wind.icon as any} size={20} color={energyData.wind.color} />
                   <ThemedText style={styles.sourceTitle}>Wind</ThemedText>
                 </View>
                 <ThemedText style={[styles.sourceValue, { color: energyData.wind.color }]}>
                   {energyData.wind.watts.toFixed(1)}W
                 </ThemedText>
                 <ThemedText style={styles.sourceSubtext}>
                   {energyData.wind.amps.toFixed(1)}A • {energyData.wind.volts.toFixed(1)}V
                 </ThemedText>
                 <View style={styles.contributionBar}>
                   <View 
                     style={[
                       styles.contributionFill, 
                       { 
                         backgroundColor: energyData.wind.color,
                         width: `${energyData.totalOutput > 0 ? (energyData.wind.watts / energyData.totalOutput) * 100 : 0}%`
                       }
                     ]} 
                   />
                 </View>
               </View>

               <View style={[styles.sourceCard, { borderLeftColor: energyData.gutter.color }]}>
                 <View style={styles.sourceHeader}>
                   <Ionicons name={energyData.gutter.icon as any} size={20} color={energyData.gutter.color} />
                   <ThemedText style={styles.sourceTitle}>Gutter</ThemedText>
                 </View>
                 <ThemedText style={[styles.sourceValue, { color: energyData.gutter.color }]}>
                   {energyData.gutter.watts.toFixed(1)}W
                 </ThemedText>
                 <ThemedText style={styles.sourceSubtext}>
                   {energyData.gutter.amps.toFixed(1)}A • {energyData.gutter.volts.toFixed(1)}V
                 </ThemedText>
                 <View style={styles.contributionBar}>
                   <View 
                     style={[
                       styles.contributionFill, 
                       { 
                         backgroundColor: energyData.gutter.color,
                         width: `${energyData.totalOutput > 0 ? (energyData.gutter.watts / energyData.totalOutput) * 100 : 0}%`
                       }
                     ]} 
                   />
                 </View>
               </View>
             </View>

           
           </Animated.View>
             
        

         
         </ScrollView>
      </ThemedView>

      {/* Energy Source Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedEnergySource && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitle}>
                    <Ionicons 
                      name={selectedEnergySource.icon as any} 
                      size={24} 
                      color={selectedEnergySource.color}
                    />
                    <ThemedText style={styles.modalTitleText}>
                      {selectedEnergySource.name}
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Ionicons 
                      name="close" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].text}
                    />
                  </TouchableOpacity>
                </View>

                {/* Main Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: selectedEnergySource.color }]}>
                        {selectedEnergySource.amps.toFixed(1)}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Amps
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: selectedEnergySource.color }]}>
                        {selectedEnergySource.volts.toFixed(1)}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Volts
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: selectedEnergySource.color }]}>
                        {selectedEnergySource.watts}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Watts
                      </ThemedText>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={[
                    styles.statusBadge, 
                    { 
                      backgroundColor: selectedEnergySource.status === 'active' 
                        ? '#4CAF50' 
                        : selectedEnergySource.status === 'maintenance' 
                        ? '#FF9800' 
                        : '#F44336'
                    }
                  ]}>
                    <ThemedText style={[styles.statusText, { color: 'white' }]}>
                      {selectedEnergySource.status}
                    </ThemedText>
                  </View>
                </View>

                {/* Additional Statistics */}
                <View style={styles.additionalStats}>
                  <ThemedText style={[
                    styles.modalTitleText, 
                    { fontSize: 16, marginBottom: 15, color: Colors[colorScheme ?? 'light'].text }
                  ]}>
                    Performance Statistics
                  </ThemedText>
                  
                  {(() => {
                    const stats = getAdditionalStats(selectedEnergySource);
                    return (
                      <>
                        <View style={styles.additionalStatItem}>
                          <ThemedText style={[styles.additionalStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                            Efficiency
                          </ThemedText>
                          <ThemedText style={[styles.additionalStatValue, { color: selectedEnergySource.color }]}>
                            {selectedEnergySource.efficiency}%
                          </ThemedText>
                        </View>
                        
                        <View style={styles.additionalStatItem}>
                          <ThemedText style={[styles.additionalStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                            Daily Production
                          </ThemedText>
                          <ThemedText style={[styles.additionalStatValue, { color: selectedEnergySource.color }]}>
                            {stats.dailyProduction} Wh
                          </ThemedText>
                        </View>
                        
                        <View style={styles.additionalStatItem}>
                          <ThemedText style={[styles.additionalStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                            Monthly Production
                          </ThemedText>
                          <ThemedText style={[styles.additionalStatValue, { color: selectedEnergySource.color }]}>
                            {stats.monthlyProduction} Wh
                          </ThemedText>
                        </View>
                        
                        <View style={styles.additionalStatItem}>
                          <ThemedText style={[styles.additionalStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                            Carbon Offset
                          </ThemedText>
                          <ThemedText style={[styles.additionalStatValue, { color: '#4CAF50' }]}>
                            {stats.carbonOffset} kg CO₂/day
                          </ThemedText>
                        </View>
                        
                        <View style={styles.additionalStatItem}>
                          <ThemedText style={[styles.additionalStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                            Cost Savings
                          </ThemedText>
                          <ThemedText style={[styles.additionalStatValue, { color: '#4CAF50' }]}>
                            ${stats.costSavings}/day
                          </ThemedText>
                        </View>
                        
                        <View style={styles.additionalStatItem}>
                          <ThemedText style={[styles.additionalStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                            Operating Temperature
                          </ThemedText>
                          <ThemedText style={[styles.additionalStatValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                            {stats.temperature}
                          </ThemedText>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
