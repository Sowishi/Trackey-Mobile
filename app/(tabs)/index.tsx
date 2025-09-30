import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function TrackingScreen() {
  const colorScheme = useColorScheme();

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
      paddingBottom: 50,

    },
    map: {
      flex: 1,

    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '10',
      paddingBottom: 100,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
       
        
        {/* Full-screen map */}
        <View style={styles.mapContainer}>
          <WebView
            style={styles.map}
            source={{ uri: 'https://projects-b1c71.web.app/trackey/tracking-mobile' }}
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