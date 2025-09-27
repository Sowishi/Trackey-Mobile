import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

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

  const currentLocation = location ? {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  } : {
    lat: defaultRegion.latitude,
    lng: defaultRegion.longitude,
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; }
            html, body { height: 100%; }
            #map { height: 100%; width: 100%; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            function initMap() {
                const map = new google.maps.Map(document.getElementById("map"), {
                    zoom: 12,
                    center: { lat: ${currentLocation.lat}, lng: ${currentLocation.lng} },
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: false,
                });
                
                // Add a marker at the center
                new google.maps.Marker({
                    position: { lat: ${currentLocation.lat}, lng: ${currentLocation.lng} },
                    map: map,
                    title: "Current Location",
                });
            }
        </script>
        <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBtlOXvz1Cr11cC4ZhLhXc4U0hQ00D6V50&callback=initMap">
        </script>
    </body>
    </html>
  `;

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
          <WebView
            style={styles.map}
            source={{ html: mapHtml }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
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
          />
        </View>
      </View>
    </SafeAreaView>
  );
}