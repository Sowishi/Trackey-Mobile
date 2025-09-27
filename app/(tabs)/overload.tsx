import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Vehicle {
  id: number;
  type: 'car' | 'truck' | 'bus';
  weight: number;
  maxWeight: number;
  position: number;
  color: string;
  licensePlate: string;
}

interface BridgeSensor {
  id: number;
  position: number;
  currentLoad: number;
  maxLoad: number;
  status: 'normal' | 'warning' | 'critical';
}

export default function OverloadCollectionScreen() {
  const colorScheme = useColorScheme();
  const screenWidth = Dimensions.get('window').width;
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [animationValue] = useState(new Animated.Value(0));

  // Sample bridge data
  const bridgeLength = screenWidth - 40;
  const bridgeHeight = 60;

  // Sample vehicles on bridge
  const [vehicles] = useState<Vehicle[]>([
    {
      id: 1,
      type: 'car',
      weight: 1.8,
      maxWeight: 2.0,
      position: 15,
      color: '#4285F4',
      licensePlate: 'ABC-123'
    },
    {
      id: 2,
      type: 'truck',
      weight: 45.5,
      maxWeight: 40.0,
      position: 40,
      color: '#FF4444',
      licensePlate: 'TRK-789'
    },
    {
      id: 3,
      type: 'bus',
      weight: 18.2,
      maxWeight: 25.0,
      position: 70,
      color: '#34A853',
      licensePlate: 'BUS-456'
    },
    {
      id: 4,
      type: 'car',
      weight: 1.5,
      maxWeight: 2.0,
      position: 85,
      color: '#9AA0A6',
      licensePlate: 'XYZ-999'
    }
  ]);

  // Bridge sensors
  const [sensors] = useState<BridgeSensor[]>([
    { id: 1, position: 20, currentLoad: 15.8, maxLoad: 50.0, status: 'normal' },
    { id: 2, position: 40, currentLoad: 45.5, maxLoad: 50.0, status: 'critical' },
    { id: 3, position: 60, currentLoad: 28.2, maxLoad: 50.0, status: 'normal' },
    { id: 4, position: 80, currentLoad: 35.7, maxLoad: 50.0, status: 'warning' }
  ]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
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
    bridgeContainer: {
      marginVertical: 20,
      alignItems: 'center',
    },
    bridgeTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 15,
      textAlign: 'center',
    },
    bridgeView: {
      position: 'relative',
      width: bridgeLength,
      height: bridgeHeight + 100,
      marginBottom: 20,
    },
    bridge: {
      position: 'absolute',
      top: 50,
      width: bridgeLength,
      height: bridgeHeight,
      backgroundColor: '#8B7355',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#6B5B47',
    },
    bridgeSupport: {
      position: 'absolute',
      bottom: 0,
      width: 8,
      height: 30,
      backgroundColor: '#6B5B47',
      borderRadius: 4,
    },
    vehicle: {
      position: 'absolute',
      top: 25,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    car: {
      width: 40,
      height: 20,
    },
    truck: {
      width: 60,
      height: 25,
    },
    bus: {
      width: 55,
      height: 22,
    },
    vehicleText: {
      fontSize: 8,
      fontWeight: 'bold',
      color: 'white',
    },
    sensor: {
      position: 'absolute',
      top: 40,
      width: 4,
      height: 40,
      borderRadius: 2,
    },
    sensorPulse: {
      position: 'absolute',
      top: 35,
      width: 14,
      height: 14,
      borderRadius: 7,
      opacity: 0.6,
    },
    overloadAlert: {
      position: 'absolute',
      top: 10,
      backgroundColor: '#FF4444',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    alertText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 20,
    },
    statCard: {
      flex: 1,
      marginHorizontal: 4,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      opacity: 0.7,
      textAlign: 'center',
    },
    vehicleList: {
      marginTop: 20,
    },
    vehicleCard: {
      flexDirection: 'row',
      alignItems: 'center',
    padding: 16,
      marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
    vehicleIcon: {
      width: 50,
      height: 30,
      borderRadius: 6,
      marginRight: 15,
      justifyContent: 'center',
    alignItems: 'center',
  },
    vehicleInfo: {
    flex: 1,
  },
    vehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
      marginBottom: 4,
    },
    vehicleWeight: {
      fontSize: 14,
      opacity: 0.8,
      marginBottom: 2,
    },
    vehicleStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignItems: 'center',
    },
    sensorList: {
      marginTop: 20,
    },
    sensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
    },
    sensorInfo: {
      flex: 1,
      marginLeft: 15,
    },
    sensorId: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    sensorLoad: {
    fontSize: 14,
    opacity: 0.8,
  },
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return 'car-sport';
      case 'truck': return 'car';
      case 'bus': return 'bus';
      default: return 'car';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#FF4444';
      case 'warning': return '#FFB020';
      case 'normal': return '#34A853';
      default: return '#9AA0A6';
    }
  };

  const isVehicleOverloaded = (vehicle: Vehicle) => {
    return vehicle.weight > vehicle.maxWeight;
  };

  const getSensorStatus = (sensor: BridgeSensor): 'normal' | 'warning' | 'critical' => {
    const loadPercentage = (sensor.currentLoad / sensor.maxLoad) * 100;
    if (loadPercentage >= 90) return 'critical';
    if (loadPercentage >= 75) return 'warning';
    return 'normal';
  };

  const totalVehicles = vehicles.length;
  const overloadedVehicles = vehicles.filter(isVehicleOverloaded).length;
  const totalWeight = vehicles.reduce((sum, v) => sum + v.weight, 0);
  const bridgeCapacity = sensors.reduce((sum, s) => sum + s.maxLoad, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons 
              name="car-sport" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">Bridge Overload Monitor</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Real-time vehicle weight monitoring on BNHS Bridge
          </ThemedText>
        </ThemedView>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Bridge Visualization */}
          <ThemedView style={styles.bridgeContainer}>
            <ThemedText style={styles.bridgeTitle}>BNHS Monitoring Bridge</ThemedText>
            
            <View style={styles.bridgeView}>
              {/* Bridge Structure */}
              <View style={styles.bridge} />
              
              {/* Bridge Supports */}
              <View style={[styles.bridgeSupport, { left: 0 }]} />
              <View style={[styles.bridgeSupport, { left: bridgeLength / 4 - 4 }]} />
              <View style={[styles.bridgeSupport, { left: bridgeLength / 2 - 4 }]} />
              <View style={[styles.bridgeSupport, { left: (3 * bridgeLength) / 4 - 4 }]} />
              <View style={[styles.bridgeSupport, { right: 0 }]} />
              
              {/* Sensors with Pulse Animation */}
              {sensors.map((sensor) => (
                <View key={sensor.id}>
                  <View
                    style={[
                      styles.sensor,
                      {
                        left: (sensor.position / 100) * bridgeLength - 2,
                        backgroundColor: getStatusColor(getSensorStatus(sensor)),
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.sensorPulse,
                      {
                        left: (sensor.position / 100) * bridgeLength - 7,
                        backgroundColor: getStatusColor(getSensorStatus(sensor)),
                        opacity: animationValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.8],
                        }),
                        transform: [
                          {
                            scale: animationValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
              ))}
              
              {/* Vehicles */}
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicle,
                    vehicle.type === 'car' ? styles.car : vehicle.type === 'truck' ? styles.truck : styles.bus,
                    {
                      left: (vehicle.position / 100) * bridgeLength - (vehicle.type === 'truck' ? 30 : vehicle.type === 'bus' ? 27.5 : 20),
                      backgroundColor: vehicle.color,
                    },
                  ]}
                  onPress={() => setSelectedVehicle(vehicle)}
                >
                  <ThemedText style={styles.vehicleText}>
                    {vehicle.type.toUpperCase()}
                  </ThemedText>
                  
                  {/* Overload Alert */}
                  {isVehicleOverloaded(vehicle) && (
                    <View style={styles.overloadAlert}>
                      <ThemedText style={styles.alertText}>⚠️ OVERLOAD</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {totalVehicles}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Vehicles</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statValue, { color: overloadedVehicles > 0 ? '#FF4444' : '#34A853' }]}>
                {overloadedVehicles}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Overloaded</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {totalWeight.toFixed(1)}t
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Weight</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statCard}>
              <ThemedText style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {((totalWeight / bridgeCapacity) * 100).toFixed(0)}%
              </ThemedText>
              <ThemedText style={styles.statLabel}>Bridge Load</ThemedText>
            </ThemedView>
          </View>

          {/* Vehicle Details */}
          <ThemedView style={styles.vehicleList}>
            <ThemedText style={styles.bridgeTitle}>Vehicle Details</ThemedText>
            {vehicles.map((vehicle) => (
              <ThemedView key={vehicle.id} style={styles.vehicleCard}>
                <View style={[styles.vehicleIcon, { backgroundColor: vehicle.color }]}>
                  <Ionicons 
                    name={getVehicleIcon(vehicle.type)} 
                    size={24} 
                    color="white"
                  />
                </View>
                
                <View style={styles.vehicleInfo}>
                  <ThemedText style={styles.vehiclePlate}>{vehicle.licensePlate}</ThemedText>
                  <ThemedText style={styles.vehicleWeight}>
                    Weight: {vehicle.weight}t / {vehicle.maxWeight}t
                  </ThemedText>
                  <ThemedText style={[
                    styles.vehicleStatus,
                    { color: isVehicleOverloaded(vehicle) ? '#FF4444' : '#34A853' }
                  ]}>
                    {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)} • {isVehicleOverloaded(vehicle) ? 'OVERLOADED' : 'Normal'}
                  </ThemedText>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: isVehicleOverloaded(vehicle) ? '#FF4444' : '#34A853' }
                ]}>
                  <Ionicons 
                    name={isVehicleOverloaded(vehicle) ? 'warning' : 'checkmark-circle'} 
                    size={16} 
                    color="white"
                  />
                </View>
              </ThemedView>
            ))}
          </ThemedView>

          {/* Sensor Status */}
          <ThemedView style={styles.sensorList}>
            <ThemedText style={styles.bridgeTitle}>Bridge Sensors</ThemedText>
            {sensors.map((sensor) => (
              <ThemedView key={sensor.id} style={styles.sensorCard}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(getSensorStatus(sensor)) }
                ]}>
                  <Ionicons 
                    name="radio-outline" 
                    size={20} 
                    color="white"
                  />
                </View>
                
                <View style={styles.sensorInfo}>
                  <ThemedText style={styles.sensorId}>Sensor {sensor.id}</ThemedText>
                  <ThemedText style={styles.sensorLoad}>
                    Load: {sensor.currentLoad.toFixed(1)}t / {sensor.maxLoad}t ({((sensor.currentLoad / sensor.maxLoad) * 100).toFixed(0)}%)
                  </ThemedText>
                  <ThemedText style={[
                    styles.vehicleStatus,
                    { color: getStatusColor(getSensorStatus(sensor)) }
                  ]}>
                    Status: {getSensorStatus(sensor).toUpperCase()}
                  </ThemedText>
                </View>
              </ThemedView>
            ))}
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

