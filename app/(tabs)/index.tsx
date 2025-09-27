import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(true);

  // Default location (San Francisco)
  const defaultRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg('Error getting location');
        console.log('Location error:', error);
      }
    })();
  }, []);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background + 'E6',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    headerIcon: {
      marginRight: 12,
    },
    subtitle: {
      opacity: 0.7,
      fontSize: 14,
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      opacity: 0.7,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 16,
      opacity: 0.7,
    },
  });

  const currentRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : defaultRegion;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header overlay */}
        <ThemedView style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons 
              name="map" 
              size={24} 
              color={Colors[colorScheme ?? 'light'].tint} 
              style={styles.headerIcon}
            />
            <ThemedText type="title" style={{ fontSize: 20 }}>Struxis Map</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>
            Structural monitoring locations
          </ThemedText>
        </ThemedView>
        
        {/* Full-screen map */}
        <View style={styles.mapContainer}>
          {!mapReady && (
            <View style={styles.loadingContainer}>
              <Ionicons 
                name="map-outline" 
                size={60} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
              <ThemedText style={styles.loadingText}>
                Loading map...
              </ThemedText>
            </View>
          )}
          
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={currentRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}