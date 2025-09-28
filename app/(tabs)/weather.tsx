import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
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
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
  });

  const refreshWeather = () => {
    loadWeatherData();
  };

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
      </ThemedView>
    </SafeAreaView>
  );
}
