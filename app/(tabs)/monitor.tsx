import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';

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
  const [energyData, setEnergyData] = useState<EnergyMonitorData>({
    solar: {
      id: 'solar',
      name: 'Solar Panel',
      icon: 'sunny',
      color: '#FFD700',
      amps: 8.5,
      volts: 12.0,
      watts: 102,
      efficiency: 85,
      status: 'active'
    },
    wind: {
      id: 'wind',
      name: 'Wind Turbine',
      icon: 'leaf',
      color: '#4CAF50',
      amps: 15.2,
      volts: 24.0,
      watts: 365,
      efficiency: 78,
      status: 'active'
    },
    gutter: {
      id: 'gutter',
      name: 'Gutter Turbine',
      icon: 'water',
      color: '#2196F3',
      amps: 2.1,
      volts: 12.0,
      watts: 25,
      efficiency: 45,
      status: 'active'
    },
    totalOutput: 492,
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

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Simulate energy data updates every 3 seconds
    const interval = setInterval(() => {
      setEnergyData(prev => ({
        ...prev,
        solar: {
          ...prev.solar,
          amps: Math.max(0, Math.min(15, prev.solar.amps + (Math.random() - 0.5) * 2)),
          watts: Math.max(0, Math.min(120, prev.solar.watts + (Math.random() - 0.5) * 20)),
          efficiency: Math.max(70, Math.min(95, prev.solar.efficiency + (Math.random() - 0.5) * 10))
        },
        wind: {
          ...prev.wind,
          amps: Math.max(0, Math.min(25, prev.wind.amps + (Math.random() - 0.5) * 5)),
          watts: Math.max(0, Math.min(400, prev.wind.watts + (Math.random() - 0.5) * 50)),
          efficiency: Math.max(60, Math.min(90, prev.wind.efficiency + (Math.random() - 0.5) * 15))
        },
        gutter: {
          ...prev.gutter,
          amps: Math.max(0, Math.min(5, prev.gutter.amps + (Math.random() - 0.5) * 1)),
          watts: Math.max(0, Math.min(50, prev.gutter.watts + (Math.random() - 0.5) * 10)),
          efficiency: Math.max(20, Math.min(70, prev.gutter.efficiency + (Math.random() - 0.5) * 20))
        },
        batteryLevel: Math.max(20, Math.min(100, prev.batteryLevel + (Math.random() - 0.5) * 5)),
        lastUpdate: new Date().toLocaleTimeString()
      }));
      
      // Update total output
      setEnergyData(prev => ({
        ...prev,
        totalOutput: prev.solar.watts + prev.wind.watts + prev.gutter.watts
      }));
    }, 3000);

    return () => {
      clearInterval(interval);
      pulseAnimation.stop();
    };
  }, []);

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
      justifyContent: 'space-around',
      width: '100%',
      paddingHorizontal: 40,
      marginBottom: 120,
    },
    energySource: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    energyIcon: {
      marginBottom: 8,
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
    },
    svgContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    },
    totalOutputCard: {
      backgroundColor: '#2A2A2A',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].tint + '40',
      alignItems: 'center',
    },
    totalOutputValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].tint,
      marginBottom: 8,
    },
    totalOutputLabel: {
      fontSize: 16,
      fontWeight: '600',
      opacity: 0.8,
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
  });

  // Simplified Energy Source Component
  const renderEnergySource = (source: EnergySource) => (
    <Animated.View 
      key={source.id}
      style={[
        styles.energySource,
        {
          borderColor: source.color,
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim.interpolate({
            inputRange: [1, 1.3],
            outputRange: [1, 1.05]
          }) }]
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
    </Animated.View>
  );

  // SVG Connection Lines Component
  const renderConnectionLines = () => {
    // Calculate positions based on screen width
    const solarX = width * 0.25;
    const windX = width * 0.5;
    const gutterX = width * 0.75;
    const houseX = width * 0.5;
    
    const sourceY = 140; // Y position of energy sources
    const houseY = 280; // Y position of house
    
    return (
      <Svg height={height} width={width} style={styles.svgContainer}>
        {/* Solar to House */}
        <Line
          x1={solarX}
          y1={sourceY}
          x2={houseX}
          y2={houseY}
          stroke={energyData.solar.color}
          strokeWidth="2"
          strokeOpacity="0.6"
        />
        
        {/* Wind to House */}
        <Line
          x1={windX}
          y1={sourceY}
          x2={houseX}
          y2={houseY}
          stroke={energyData.wind.color}
          strokeWidth="2"
          strokeOpacity="0.6"
        />
        
        {/* Gutter to House */}
        <Line
          x1={gutterX}
          y1={sourceY}
          x2={houseX}
          y2={houseY}
          stroke={energyData.gutter.color}
          strokeWidth="2"
          strokeOpacity="0.6"
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
        
        {/* Connection dot at house */}
        <Circle
          cx={houseX}
          cy={houseY}
          r="6"
          fill={Colors[colorScheme ?? 'light'].tint}
        />
      </Svg>
    );
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return '#4CAF50';
    if (level > 30) return '#FF9800';
    return '#F44336';
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate new energy readings
      setEnergyData(prev => ({
        ...prev,
        solar: {
          ...prev.solar,
          amps: Math.max(0, Math.min(15, 8.5 + (Math.random() - 0.5) * 4)),
          watts: Math.max(0, Math.min(120, 102 + (Math.random() - 0.5) * 40)),
        },
        wind: {
          ...prev.wind,
          amps: Math.max(0, Math.min(25, 15.2 + (Math.random() - 0.5) * 8)),
          watts: Math.max(0, Math.min(400, 365 + (Math.random() - 0.5) * 80)),
        },
        gutter: {
          ...prev.gutter,
          amps: Math.max(0, Math.min(5, 2.1 + (Math.random() - 0.5) * 2)),
          watts: Math.max(0, Math.min(50, 25 + (Math.random() - 0.5) * 20)),
        },
        lastUpdate: new Date().toLocaleTimeString()
      }));
      setIsLoading(false);
    }, 1500);
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
                  transform: [{ scale: pulseAnim.interpolate({
                    inputRange: [1, 1.3],
                    outputRange: [1, 1.1]
                  }) }]
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

       

        
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
