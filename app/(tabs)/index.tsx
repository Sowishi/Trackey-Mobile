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
import { database, off, onValue, ref } from '../../firebase';

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(true);
  const [firebaseCoordinates, setFirebaseCoordinates] = useState<{lat: number, lon: number} | null>(null);

  // Default location (San Francisco)
  const defaultRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    // Get user location
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

    // Set up Firebase realtime database listeners
    const latRef = ref(database, 'BNHS-Struxis/location_1/coordinates/lat');
    const lonRef = ref(database, 'BNHS-Struxis/location_1/coordinates/lon');

    let latValue: number | null = null;
    let lonValue: number | null = null;

    const updateCoordinates = () => {
      if (latValue !== null && lonValue !== null) {
        setFirebaseCoordinates({ lat: latValue, lon: lonValue });
      }
    };

    const latListener = onValue(latRef, (snapshot: any) => {
      const data = snapshot.val();
      if (data !== null) {
        latValue = data;
        updateCoordinates();
        console.log('Firebase lat updated:', data);
      }
    });

    const lonListener = onValue(lonRef, (snapshot: any) => {
      const data = snapshot.val();
      if (data !== null) {
        lonValue = data;
        updateCoordinates();
        console.log('Firebase lon updated:', data);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      off(latRef, 'value', latListener);
      off(lonRef, 'value', lonListener);
    };
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

  // Use Firebase coordinates as map center if available, otherwise use current location
  const mapCenter = firebaseCoordinates ? {
    lat: firebaseCoordinates.lat,
    lng: firebaseCoordinates.lon,
  } : currentLocation;

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
                    zoom: 14,
                    center: { lat: ${mapCenter.lat}, lng: ${mapCenter.lng} },
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: false,
                });
                
                ${firebaseCoordinates ? `
                // Add Firebase location marker (Monitoring Station)
                new google.maps.Marker({
                    position: { lat: ${firebaseCoordinates.lat}, lng: ${firebaseCoordinates.lon} },
                    map: map,
                    title: "BNHS Struxis Monitoring Station",
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF4444" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 32)
                    }
                });
                ` : ''}
                
                ${location ? `
                // Add user location marker (if different from Firebase location)
                ${firebaseCoordinates && Math.abs(firebaseCoordinates.lat - currentLocation.lat) > 0.001 && Math.abs(firebaseCoordinates.lon - currentLocation.lng) > 0.001 ? `
                new google.maps.Marker({
                    position: { lat: ${currentLocation.lat}, lng: ${currentLocation.lng} },
                    map: map,
                    title: "Your Location",
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234285F4" width="24" height="24"><circle cx="12" cy="12" r="8"/></svg>'),
                        scaledSize: new google.maps.Size(24, 24),
                        anchor: new google.maps.Point(12, 12)
                    }
                });
                ` : ''}
                ` : ''}
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
            {firebaseCoordinates 
              ? `Live monitoring: ${firebaseCoordinates.lat.toFixed(6)}, ${firebaseCoordinates.lon.toFixed(6)}`
              : 'Connecting to monitoring station...'
            }
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