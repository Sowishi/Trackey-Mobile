import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface MonitorData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkSpeed: number;
  temperature: number;
  uptime: string;
  status: 'online' | 'warning' | 'offline';
  lastUpdate: string;
}

interface SystemAlert {
  id: number;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export default function MonitorScreen() {
  const colorScheme = useColorScheme();
  const [monitorData, setMonitorData] = useState<MonitorData>({
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
    networkSpeed: 125,
    temperature: 42,
    uptime: '15d 8h 32m',
    status: 'online',
    lastUpdate: new Date().toLocaleTimeString()
  });
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    { id: 1, type: 'info', message: 'System monitoring started', timestamp: '10:30 AM' },
    { id: 2, type: 'warning', message: 'High disk usage detected', timestamp: '10:25 AM' },
    { id: 3, type: 'info', message: 'Network connection stable', timestamp: '10:20 AM' },
  ]);
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

    // Simulate system updates every 5 seconds
    const interval = setInterval(() => {
      setMonitorData(prev => ({
        ...prev,
        cpuUsage: Math.max(10, Math.min(95, prev.cpuUsage + (Math.random() - 0.5) * 20)),
        memoryUsage: Math.max(20, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 15)),
        networkSpeed: Math.max(50, Math.min(500, prev.networkSpeed + (Math.random() - 0.5) * 100)),
        temperature: Math.max(35, Math.min(65, prev.temperature + (Math.random() - 0.5) * 10)),
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 5000);

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
    statusCard: {
      backgroundColor: '#2A2A2A',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    systemTitle: {
      fontSize: 20,
      fontWeight: '600',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    metricCard: {
      width: '48%',
      backgroundColor: '#333333',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tint + '20',
    },
    metricHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    metricIcon: {
      marginRight: 8,
    },
    metricLabel: {
      fontSize: 14,
      fontWeight: '500',
      opacity: 0.8,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    progressBar: {
      height: 6,
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      opacity: 0.7,
      marginTop: 4,
    },
    alertsSection: {
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: 8,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
    },
    alertIcon: {
      marginRight: 12,
    },
    alertContent: {
      flex: 1,
    },
    alertMessage: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    alertTime: {
      fontSize: 12,
      opacity: 0.6,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'offline': return '#F44336';
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'info': return '#2196F3';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'info': return 'information-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setMonitorData(prev => ({
        ...prev,
        cpuUsage: Math.max(10, Math.min(95, prev.cpuUsage + (Math.random() - 0.5) * 30)),
        memoryUsage: Math.max(20, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 25)),
        diskUsage: Math.max(30, Math.min(95, prev.diskUsage + (Math.random() - 0.5) * 10)),
        networkSpeed: Math.max(50, Math.min(500, prev.networkSpeed + (Math.random() - 0.5) * 150)),
        temperature: Math.max(35, Math.min(65, prev.temperature + (Math.random() - 0.5) * 15)),
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
              name="desktop" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">System Monitor</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Real-time system performance monitoring for Project Watch
          </ThemedText>
        </Animated.View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.statusCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.statusHeader}>
              <ThemedText style={styles.systemTitle}>Project Watch Server</ThemedText>
              <Animated.View 
                style={[
                  styles.statusIndicator,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(monitorData.status) }]} />
                <ThemedText style={[styles.statusText, { color: getStatusColor(monitorData.status) }]}>
                  {monitorData.status.toUpperCase()}
                </ThemedText>
              </Animated.View>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Animated.View style={{
                  transform: [{
                    rotate: pulseAnim.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }}>
                  <Ionicons 
                    name="refresh-outline" 
                    size={40} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                  />
                </Animated.View>
                <ThemedText style={styles.loadingText}>Loading system data...</ThemedText>
              </View>
            ) : (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons 
                      name="hardware-chip" 
                      size={20} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>CPU Usage</ThemedText>
                  </View>
                  <ThemedText style={styles.metricValue}>{Math.round(monitorData.cpuUsage)}%</ThemedText>
                  <View style={styles.progressBar}>
                    <Animated.View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${monitorData.cpuUsage}%`]
                          }),
                          backgroundColor: monitorData.cpuUsage > 80 ? '#F44336' : monitorData.cpuUsage > 60 ? '#FF9800' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.progressText}>
                    {monitorData.cpuUsage > 80 ? 'High' : monitorData.cpuUsage > 60 ? 'Medium' : 'Normal'}
                  </ThemedText>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons 
                      name="library" 
                      size={20} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>Memory</ThemedText>
                  </View>
                  <ThemedText style={styles.metricValue}>{Math.round(monitorData.memoryUsage)}%</ThemedText>
                  <View style={styles.progressBar}>
                    <Animated.View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${monitorData.memoryUsage}%`]
                          }),
                          backgroundColor: monitorData.memoryUsage > 85 ? '#F44336' : monitorData.memoryUsage > 70 ? '#FF9800' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.progressText}>
                    {monitorData.memoryUsage > 85 ? 'High' : monitorData.memoryUsage > 70 ? 'Medium' : 'Normal'}
                  </ThemedText>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons 
                      name="server" 
                      size={20} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>Disk Usage</ThemedText>
                  </View>
                  <ThemedText style={styles.metricValue}>{Math.round(monitorData.diskUsage)}%</ThemedText>
                  <View style={styles.progressBar}>
                    <Animated.View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${monitorData.diskUsage}%`]
                          }),
                          backgroundColor: monitorData.diskUsage > 90 ? '#F44336' : monitorData.diskUsage > 75 ? '#FF9800' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.progressText}>
                    {monitorData.diskUsage > 90 ? 'Critical' : monitorData.diskUsage > 75 ? 'Warning' : 'Normal'}
                  </ThemedText>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons 
                      name="speedometer" 
                      size={20} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>Network</ThemedText>
                  </View>
                  <ThemedText style={styles.metricValue}>{Math.round(monitorData.networkSpeed)}</ThemedText>
                  <ThemedText style={styles.progressText}>Mbps</ThemedText>
                </View>
              </View>
            )}
          </Animated.View>

          <Animated.View 
            style={[
              styles.alertsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 25]
                }) }]
              }
            ]}
          >
            <View style={styles.sectionTitle}>
              <Ionicons 
                name="notifications" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={styles.sectionIcon}
              />
              <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>System Alerts</ThemedText>
            </View>
            
            {alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <Ionicons 
                  name={getAlertIcon(alert.type)} 
                  size={24} 
                  color={getAlertColor(alert.type)}
                  style={styles.alertIcon}
                />
                <View style={styles.alertContent}>
                  <ThemedText style={styles.alertMessage}>{alert.message}</ThemedText>
                  <ThemedText style={styles.alertTime}>{alert.timestamp}</ThemedText>
                </View>
              </View>
            ))}
          </Animated.View>

          <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
            <Ionicons 
              name="refresh" 
              size={28} 
              color="white"
            />
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
