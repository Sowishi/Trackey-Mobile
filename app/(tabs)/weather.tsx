import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  condition: string;
  icon: string;
  location: string;
  lastUpdate: string;
}

export default function WeatherScreen() {
  const colorScheme = useColorScheme();
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    pressure: 1013,
    condition: 'Partly Cloudy',
    icon: 'partly-sunny',
    location: 'Project Watch Station',
    lastUpdate: new Date().toLocaleTimeString()
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
    ]).start();

    // Pulsing animation for live indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation for weather icon
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Simulate weather updates every 30 seconds
    const interval = setInterval(() => {
      setWeatherData(prev => ({
        ...prev,
        temperature: 25 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        windSpeed: 5 + Math.random() * 20,
        pressure: 1000 + Math.random() * 30,
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 30000);

    return () => {
      clearInterval(interval);
      pulseAnimation.stop();
      rotateAnimation.stop();
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
    weatherCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    weatherHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    locationText: {
      fontSize: 18,
      fontWeight: '600',
      opacity: 0.8,
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#4CAF50',
      marginRight: 6,
    },
    liveText: {
      fontSize: 12,
      color: '#4CAF50',
      fontWeight: '600',
    },
    mainWeather: {
      alignItems: 'center',
      marginBottom: 30,
    },
    weatherIcon: {
      marginBottom: 16,
    },
    temperature: {
      fontSize: 64,
      fontWeight: '200',
      marginBottom: 8,
    },
    condition: {
      fontSize: 20,
      fontWeight: '500',
      opacity: 0.8,
    },
    lastUpdate: {
      fontSize: 14,
      opacity: 0.6,
      marginTop: 8,
    },
    weatherGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    weatherMetric: {
      width: '48%',
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
    },
    metricIcon: {
      marginBottom: 8,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 14,
      opacity: 0.7,
      textAlign: 'center',
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
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10',
      borderRadius: 16,
    },
    loadingText: {
      marginTop: 12,
      opacity: 0.7,
    },
  });

  const refreshWeather = () => {
    setIsLoading(true);
    setTimeout(() => {
      setWeatherData(prev => ({
        ...prev,
        temperature: 25 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        windSpeed: 5 + Math.random() * 20,
        pressure: 1000 + Math.random() * 30,
        lastUpdate: new Date().toLocaleTimeString()
      }));
      setIsLoading(false);
    }, 1500);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return 'sunny';
      case 'Partly Cloudy': return 'partly-sunny';
      case 'Cloudy': return 'cloudy';
      case 'Rainy': return 'rainy';
      default: return 'partly-sunny';
    }
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
              name="cloud" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">Weather Station</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Real-time weather monitoring for Project Watch
          </ThemedText>
        </Animated.View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.weatherCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.weatherHeader}>
              <ThemedText style={styles.locationText}>{weatherData.location}</ThemedText>
              <Animated.View 
                style={[
                  styles.liveIndicator,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={styles.liveDot} />
                <ThemedText style={styles.liveText}>LIVE</ThemedText>
              </Animated.View>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Animated.View style={{
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
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
                <ThemedText style={styles.loadingText}>Loading weather data...</ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.mainWeather}>
                  <Animated.View 
                    style={[
                      styles.weatherIcon,
                      {
                        transform: [{
                          rotate: rotateAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '10deg']
                          })
                        }]
                      }
                    ]}
                  >
                    <Ionicons 
                      name={getWeatherIcon(weatherData.condition)} 
                      size={80} 
                      color={Colors[colorScheme ?? 'light'].tint}
                    />
                  </Animated.View>
                  <ThemedText style={styles.temperature}>
                    {Math.round(weatherData.temperature)}°C
                  </ThemedText>
                  <ThemedText style={styles.condition}>{weatherData.condition}</ThemedText>
                  <ThemedText style={styles.lastUpdate}>
                    Last updated: {weatherData.lastUpdate}
                  </ThemedText>
                </View>

                <View style={styles.weatherGrid}>
                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="water" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{Math.round(weatherData.humidity)}%</ThemedText>
                    <ThemedText style={styles.metricLabel}>Humidity</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="flag" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{Math.round(weatherData.windSpeed)} km/h</ThemedText>
                    <ThemedText style={styles.metricLabel}>Wind Speed</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="speedometer" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{Math.round(weatherData.pressure)} hPa</ThemedText>
                    <ThemedText style={styles.metricLabel}>Pressure</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="thermometer" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{Math.round(weatherData.temperature - 3)}°C</ThemedText>
                    <ThemedText style={styles.metricLabel}>Feels Like</ThemedText>
                  </View>
                </View>
              </>
            )}
          </Animated.View>

          <TouchableOpacity style={styles.refreshButton} onPress={refreshWeather}>
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
