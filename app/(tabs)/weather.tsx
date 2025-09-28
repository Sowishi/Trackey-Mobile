import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  condition: string;
  icon: string;
  location: string;
  lastUpdate: string;
  feelsLike: number;
  chanceOfRain: number;
  visibility: number;
  uvIndex: number;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  visibility: number;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
}

interface OpenWeatherForecastResponse {
  list: Array<{
    main: {
      temp: number;
    };
    weather: Array<{
      main: string;
    }>;
    pop: number; // Probability of precipitation
    dt: number;
  }>;
}

const API_KEY = 'd9c9e08dfa990d4a79b3b87a5b783bf3';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export default function WeatherScreen() {
  const colorScheme = useColorScheme();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Fetch weather data from OpenWeatherMap API
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setError(null);
      
      // Fetch current weather
      const weatherResponse = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      
      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }
      
      const weatherJson: OpenWeatherResponse = await weatherResponse.json();
      
      // Fetch forecast for chance of rain
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=8`
      );
      
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status}`);
      }
      
      const forecastJson: OpenWeatherForecastResponse = await forecastResponse.json();
      
      // Calculate chance of rain from next 24 hours
      const chanceOfRain = Math.max(...forecastJson.list.map(item => item.pop)) * 100;
      
      const weatherData: WeatherData = {
        temperature: Math.round(weatherJson.main.temp),
        humidity: weatherJson.main.humidity,
        windSpeed: Math.round(weatherJson.wind.speed * 3.6), // Convert m/s to km/h
        pressure: weatherJson.main.pressure,
        condition: weatherJson.weather[0].description
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        icon: getWeatherIcon(weatherJson.weather[0].main, weatherJson.weather[0].icon),
        location: weatherJson.name,
        lastUpdate: new Date().toLocaleTimeString(),
        feelsLike: Math.round(weatherJson.main.feels_like),
        chanceOfRain: Math.round(chanceOfRain),
        visibility: Math.round(weatherJson.visibility / 1000), // Convert to km
        uvIndex: 0, // Would need UV API for this
        coordinates: {
          lat: weatherJson.coord.lat,
          lon: weatherJson.coord.lon,
        },
      };
      
      setWeatherData(weatherData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
      setIsLoading(false);
    }
  };

  // Get user location and fetch weather
  const loadWeatherData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback to a default location (Manila, Philippines)
        await fetchWeatherData(14.5995, 120.9842);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      await fetchWeatherData(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location. Using default location.');
      // Fallback to Manila, Philippines
      await fetchWeatherData(14.5995, 120.9842);
    }
  };

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

    // Load weather data on component mount
    loadWeatherData();

    // Update weather data every 10 minutes
    const interval = setInterval(() => {
      loadWeatherData();
    }, 600000); // 10 minutes

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
      backgroundColor: '#2A2A2A',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
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
      padding: 20
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
      backgroundColor: '#333333',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tint + '20',
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
      backgroundColor: '#333333',
      borderRadius: 16,
    },
    loadingText: {
      marginTop: 12,
      opacity: 0.7,
    },
    aiSection: {
      marginTop: 20,
      backgroundColor: '#2A2A2A',
      borderRadius: 20,
      padding: 20,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].tint + '40',
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    aiIcon: {
      marginRight: 12,
    },
    aiTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].tint,
    },
    aiSubtitle: {
      fontSize: 14,
      opacity: 0.8,
      marginBottom: 20,
    },
    powerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    powerCard: {
      width: '48%',
      backgroundColor: '#333333',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tint + '30',
    },
    powerIcon: {
      marginBottom: 8,
    },
    powerOutput: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    powerLabel: {
      fontSize: 12,
      opacity: 0.7,
      textAlign: 'center',
      marginBottom: 4,
    },
    powerEfficiency: {
      fontSize: 10,
      opacity: 0.6,
      textAlign: 'center',
    },
    totalPowerCard: {
      width: '100%',
      backgroundColor: Colors[colorScheme ?? 'light'].tint + '20',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].tint + '60',
    },
    totalPowerOutput: {
      fontSize: 32,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].tint,
      marginBottom: 8,
    },
    totalPowerLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].tint,
    },
    recommendationsSection: {
      marginTop: 16,
    },
    recommendationTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: Colors[colorScheme ?? 'light'].tint,
    },
    recommendation: {
      backgroundColor: '#444444',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: Colors[colorScheme ?? 'light'].tint,
    },
    recommendationText: {
      fontSize: 14,
      lineHeight: 18,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      maxHeight: height * 0.85,
      minHeight: height * 0.6,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '40',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalScrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    // FAB styles
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabIcon: {
      marginLeft: 2, // Slight adjustment for visual balance
    },
  });

  const refreshWeather = () => {
    loadWeatherData();
  };

  const openModal = () => {
    setIsModalVisible(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };

  // Pan responder for swipe down to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        modalSlideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > height * 0.3) {
        closeModal();
      } else {
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const getWeatherIcon = (main: string, iconCode: string) => {
    // Use OpenWeatherMap icon codes to determine appropriate Ionicon
    switch (main.toLowerCase()) {
      case 'clear':
        return iconCode.includes('d') ? 'sunny' : 'moon';
      case 'clouds':
        return iconCode.includes('d') ? 'partly-sunny' : 'cloudy-night';
      case 'rain':
      case 'drizzle':
        return 'rainy';
      case 'thunderstorm':
        return 'thunderstorm';
      case 'snow':
        return 'snow';
      case 'mist':
      case 'fog':
      case 'haze':
        return 'cloudy';
      default:
        return 'partly-sunny';
    }
  };

  const getRainChanceColor = (chance: number) => {
    if (chance >= 70) return '#FF4444'; // High chance - red
    if (chance >= 40) return '#FF9800'; // Medium chance - orange
    if (chance >= 20) return '#FFD700'; // Low chance - yellow
    return '#4CAF50'; // Very low chance - green
  };

  const getRainChanceText = (chance: number) => {
    if (chance >= 70) return 'High';
    if (chance >= 40) return 'Medium';
    if (chance >= 20) return 'Low';
    return 'Very Low';
  };

  // AI Weather Predictor - Calculate power output for renewable energy systems
  const calculatePowerOutput = (weatherData: WeatherData) => {
    // Solar Panel (100W) - Based on weather condition, cloud cover, and time
    let solarEfficiency = 0.8; // Base efficiency
    const condition = weatherData.condition.toLowerCase();
    
    if (condition.includes('clear') || condition.includes('sunny')) {
      solarEfficiency = 0.95;
    } else if (condition.includes('partly') || condition.includes('few clouds')) {
      solarEfficiency = 0.75;
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
      solarEfficiency = 0.45;
    } else if (condition.includes('rain') || condition.includes('storm')) {
      solarEfficiency = 0.15;
    } else if (condition.includes('snow') || condition.includes('fog')) {
      solarEfficiency = 0.25;
    }

    // Adjust for rain chance
    solarEfficiency *= (1 - (weatherData.chanceOfRain / 200)); // Reduce by rain chance
    
    const solarOutput = Math.round(100 * solarEfficiency);

    // Wind Turbine (400W) - Based on wind speed (cut-in: 3m/s, rated: 12m/s, cut-out: 25m/s)
    const windSpeedMs = weatherData.windSpeed / 3.6; // Convert km/h to m/s
    let windOutput = 0;
    
    if (windSpeedMs >= 3 && windSpeedMs <= 25) {
      if (windSpeedMs <= 12) {
        // Power curve approximation: P = 0.5 * ρ * A * V³ * Cp (simplified)
        windOutput = Math.round(400 * Math.min(1, (windSpeedMs - 3) / 9));
      } else {
        windOutput = 400; // Rated power
      }
    }

    // Gutter Motor Turbine (50W) - Based on rain and wind
    let gutterOutput = 0;
    if (weatherData.chanceOfRain > 30) {
      // Rain provides water flow
      const rainFactor = Math.min(1, weatherData.chanceOfRain / 70);
      gutterOutput += Math.round(35 * rainFactor);
    }
    if (windSpeedMs > 2) {
      // Wind assists the turbine
      const windFactor = Math.min(1, windSpeedMs / 10);
      gutterOutput += Math.round(15 * windFactor);
    }
    gutterOutput = Math.min(50, gutterOutput); // Cap at rated power

    const totalOutput = solarOutput + windOutput + gutterOutput;

    return {
      solar: { output: solarOutput, efficiency: Math.round(solarEfficiency * 100) },
      wind: { output: windOutput, efficiency: Math.round((windOutput / 400) * 100) },
      gutter: { output: gutterOutput, efficiency: Math.round((gutterOutput / 50) * 100) },
      total: totalOutput,
    };
  };

  const getAIRecommendation = (powerData: any, weatherData: WeatherData) => {
    const recommendations = [];
    
    if (powerData.solar.efficiency > 80) {
      recommendations.push("☀️ Excellent solar conditions! Peak energy generation expected.");
    } else if (powerData.solar.efficiency < 30) {
      recommendations.push("⛅ Poor solar conditions. Consider battery backup.");
    }

    if (powerData.wind.output > 300) {
      recommendations.push("💨 Strong winds detected! Wind turbine at high efficiency.");
    } else if (powerData.wind.output < 50) {
      recommendations.push("🌬️ Low wind speeds. Wind generation minimal.");
    }

    if (weatherData.chanceOfRain > 60) {
      recommendations.push("🌧️ High rain probability! Gutter turbine will be active.");
    }

    if (powerData.total > 400) {
      recommendations.push("⚡ High total output predicted! Excellent renewable energy conditions.");
    } else if (powerData.total < 100) {
      recommendations.push("🔋 Low output expected. Consider energy conservation measures.");
    }

    return recommendations.length > 0 ? recommendations : ["📊 Monitoring weather conditions for optimal energy prediction."];
  };

  // AI Predictor Modal Component
  const renderAIPredictorModal = () => {
    if (!weatherData) return null;

    const powerData = calculatePowerOutput(weatherData);
    const recommendations = getAIRecommendation(powerData, weatherData);

    return (
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeModal}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: modalSlideAnim }]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHandle} />
              
              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.aiHeader}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons 
                      name="bulb" 
                      size={28} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.aiIcon}
                    />
                  </Animated.View>
                  <ThemedText style={styles.aiTitle}>AI Energy Predictor</ThemedText>
                </View>
                
                <ThemedText style={styles.aiSubtitle}>
                  Smart renewable energy output predictions based on current weather conditions
                </ThemedText>

                {/* Total Power Output */}
                <View style={styles.totalPowerCard}>
                  <ThemedText style={styles.totalPowerOutput}>
                    {powerData.total}W
                  </ThemedText>
                  <ThemedText style={styles.totalPowerLabel}>
                    Predicted Total Output
                  </ThemedText>
                </View>

                {/* Individual Power Sources */}
                <View style={styles.powerGrid}>
                  <View style={styles.powerCard}>
                    <Ionicons 
                      name="sunny" 
                      size={28} 
                      color="#FFD700"
                      style={styles.powerIcon}
                    />
                    <ThemedText style={[styles.powerOutput, { color: '#FFD700' }]}>
                      {powerData.solar.output}W
                    </ThemedText>
                    <ThemedText style={styles.powerLabel}>Solar Panel (100W)</ThemedText>
                    <ThemedText style={styles.powerEfficiency}>
                      {powerData.solar.efficiency}% efficiency
                    </ThemedText>
                  </View>

                  <View style={styles.powerCard}>
                    <Ionicons 
                      name="leaf" 
                      size={28} 
                      color="#4CAF50"
                      style={styles.powerIcon}
                    />
                    <ThemedText style={[styles.powerOutput, { color: '#4CAF50' }]}>
                      {powerData.wind.output}W
                    </ThemedText>
                    <ThemedText style={styles.powerLabel}>Wind Turbine (400W)</ThemedText>
                    <ThemedText style={styles.powerEfficiency}>
                      {powerData.wind.efficiency}% efficiency
                    </ThemedText>
                  </View>

                  <View style={styles.powerCard}>
                    <Ionicons 
                      name="water" 
                      size={28} 
                      color="#2196F3"
                      style={styles.powerIcon}
                    />
                    <ThemedText style={[styles.powerOutput, { color: '#2196F3' }]}>
                      {powerData.gutter.output}W
                    </ThemedText>
                    <ThemedText style={styles.powerLabel}>Gutter Turbine (50W)</ThemedText>
                    <ThemedText style={styles.powerEfficiency}>
                      {powerData.gutter.efficiency}% efficiency
                    </ThemedText>
                  </View>

                  <View style={styles.powerCard}>
                    <Ionicons 
                      name="flash" 
                      size={28} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.powerIcon}
                    />
                    <ThemedText style={[styles.powerOutput, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      {Math.round((powerData.total / 550) * 100)}%
                    </ThemedText>
                    <ThemedText style={styles.powerLabel}>System Efficiency</ThemedText>
                    <ThemedText style={styles.powerEfficiency}>
                      of {550}W total capacity
                    </ThemedText>
                  </View>
                </View>

                {/* AI Recommendations */}
                <View style={styles.recommendationsSection}>
                  <ThemedText style={styles.recommendationTitle}>
                    🤖 AI Recommendations
                  </ThemedText>
                  {recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendation}>
                      <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
                    </View>
                  ))}
                </View>

                {/* Close button */}
                <TouchableOpacity 
                  style={[styles.refreshButton, { marginTop: 30, marginBottom: 20 }]}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
              name="cloud" 
              size={28} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title">Weather Station</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Real-time weather data from OpenWeatherMap • Focus: Chance of Rain
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
              <ThemedText style={styles.locationText}>
                {weatherData?.location || 'Loading...'}
              </ThemedText>
              {!error && (
                <Animated.View 
                  style={[
                    styles.liveIndicator,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <View style={styles.liveDot} />
                  <ThemedText style={styles.liveText}>LIVE</ThemedText>
                </Animated.View>
              )}
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
                <ThemedText style={styles.loadingText}>Loading real weather data...</ThemedText>
              </View>
            ) : error ? (
              <View style={styles.loadingContainer}>
                <Ionicons 
                  name="alert-circle" 
                  size={40} 
                  color="#FF4444"
                />
                <ThemedText style={styles.loadingText}>{error}</ThemedText>
                <TouchableOpacity 
                  style={[styles.refreshButton, { marginTop: 16 }]}
                  onPress={refreshWeather}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : weatherData ? (
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
                      name={weatherData.icon as any} 
                      size={80} 
                      color={Colors[colorScheme ?? 'light'].tint}
                    />
                  </Animated.View>
                  <ThemedText style={styles.temperature}>
                    {weatherData.temperature}°C
                  </ThemedText>
                  <ThemedText style={styles.condition}>{weatherData.condition}</ThemedText>
                  <ThemedText style={styles.lastUpdate}>
                    Last updated: {weatherData.lastUpdate}
                  </ThemedText>
                </View>

                {/* Chance of Rain - Key Feature */}
                <View style={[styles.weatherMetric, { 
                  width: '100%', 
                  marginBottom: 20,
                  backgroundColor: getRainChanceColor(weatherData.chanceOfRain) + '20',
                  borderColor: getRainChanceColor(weatherData.chanceOfRain) + '50',
                  borderWidth: 2,
                }]}>
                  <Ionicons 
                    name="rainy" 
                    size={32} 
                    color={getRainChanceColor(weatherData.chanceOfRain)}
                    style={styles.metricIcon}
                  />
                  <ThemedText style={[styles.metricValue, { 
                    fontSize: 36, 
                    color: getRainChanceColor(weatherData.chanceOfRain) 
                  }]}>
                    {weatherData.chanceOfRain}%
                  </ThemedText>
                  <ThemedText style={[styles.metricLabel, { fontSize: 16, fontWeight: '600' }]}>
                    Chance of Rain - {getRainChanceText(weatherData.chanceOfRain)}
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
                    <ThemedText style={styles.metricValue}>{weatherData.humidity}%</ThemedText>
                    <ThemedText style={styles.metricLabel}>Humidity</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="flag" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{weatherData.windSpeed} km/h</ThemedText>
                    <ThemedText style={styles.metricLabel}>Wind Speed</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="speedometer" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{weatherData.pressure} hPa</ThemedText>
                    <ThemedText style={styles.metricLabel}>Pressure</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="thermometer" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{weatherData.feelsLike}°C</ThemedText>
                    <ThemedText style={styles.metricLabel}>Feels Like</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="eye" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>{weatherData.visibility} km</ThemedText>
                    <ThemedText style={styles.metricLabel}>Visibility</ThemedText>
                  </View>

                  <View style={styles.weatherMetric}>
                    <Ionicons 
                      name="location" 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricValue}>
                      {weatherData.coordinates.lat.toFixed(2)}, {weatherData.coordinates.lon.toFixed(2)}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Coordinates</ThemedText>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <Ionicons 
                  name="alert-circle" 
                  size={40} 
                  color="#FF4444"
                />
                <ThemedText style={styles.loadingText}>No weather data available</ThemedText>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Floating Action Button */}
        {weatherData && !isLoading && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={openModal}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="bulb" 
              size={24} 
              color="white"
              style={styles.fabIcon}
            />
          </TouchableOpacity>
        )}

        {/* AI Predictor Modal */}
        {renderAIPredictorModal()}
      </ThemedView>
    </SafeAreaView>
  );
}
