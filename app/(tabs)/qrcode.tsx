import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function QRCodeScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      setScannedData(data);
      setIsCameraActive(false);
      setIsLoading(true);
      console.log(data);

      // Navigate after 3 seconds
      setTimeout(() => {
        setIsLoading(false);
        router.push({
          pathname: '/(tabs)/user-detail',
          params: {
            userId: data,
          },
        });
      }, 1500);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData(null);
    setIsCameraActive(true);
    setIsLoading(false);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    cameraContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: '#000',
      position: 'relative',
      paddingBottom: 80,
    },
    camera: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: (screenHeight - 300) / 2,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: (screenHeight - 300) / 2,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayLeft: {
      position: 'absolute',
      top: (screenHeight - 300) / 2,
      left: 0,
      width: (screenWidth - 300) / 2,
      height: 300,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayRight: {
      position: 'absolute',
      top: (screenHeight - 300) / 2,
      right: 0,
      width: (screenWidth - 300) / 2,
      height: 300,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scanFrame: {
      width: 300,
      height: 300,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      borderRadius: 12,
      position: 'relative',
    },
    cornerTopLeft: {
      position: 'absolute',
      top: -2,
      left: -2,
      width: 40,
      height: 40,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderTopLeftRadius: 12,
    },
    cornerTopRight: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 40,
      height: 40,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderTopRightRadius: 12,
    },
    cornerBottomLeft: {
      position: 'absolute',
      bottom: -2,
      left: -2,
      width: 40,
      height: 40,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderBottomLeftRadius: 12,
    },
    cornerBottomRight: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 40,
      height: 40,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: Colors[colorScheme ?? 'light'].primary,
      borderBottomRightRadius: 12,
    },
    instructionContainer: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    instructionText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    instructionSubtext: {
      fontSize: 14,
      color: '#FFFFFF',
      textAlign: 'center',
      marginTop: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    bottomControls: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    scanAgainButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    scanAgainText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    icon: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
      textAlign: 'center',
      marginBottom: 24,
    },
    permissionButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    permissionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    scannedDataContainer: {
      position: 'absolute',
      bottom: 120,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 16,
      borderRadius: 12,
      maxHeight: 150,
    },
    scannedDataTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].primary,
      marginBottom: 8,
    },
    scannedDataText: {
      fontSize: 14,
      color: '#FFFFFF',
      lineHeight: 20,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingContainer: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 119, 182, 0.2)',
      padding: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    loadingSpinner: {
      marginBottom: 20,
    },
    loadingText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    loadingSubtext: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.8,
      textAlign: 'center',
    },
  });

  // Check if permission is not granted
  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="QR Code Scanner" 
          onUserPress={() => router.push('/(tabs)/profile')}
          profilePicUrl={user?.profilePicUrl}
        />
        <View style={styles.permissionContainer}>
          <Ionicons 
            name="camera-outline" 
            size={80} 
            color={Colors[colorScheme ?? 'light'].primary}
            style={styles.icon}
          />
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.subtitle}>
            We need access to your camera to scan QR codes
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title="QR Code Scanner" 
        onUserPress={() => router.push('/(tabs)/profile')}
        profilePicUrl={user?.profilePicUrl}
      />
      <View style={styles.cameraContainer}>
        {isCameraActive && (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417'],
            }}
          />
        )}

        {/* Overlay with scan frame */}
        <View style={styles.overlay}>
          {/* Dark overlays around scan frame */}
          <View style={styles.overlayTop} />
          <View style={styles.overlayBottom} />
          <View style={styles.overlayLeft} />
          <View style={styles.overlayRight} />

          {/* Scan frame with corner indicators */}
          <View style={styles.scanFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {scanned ? 'QR Code Scanned!' : 'Align QR Code within frame'}
          </Text>
          {!scanned && (
            <Text style={styles.instructionSubtext}>
              Position the QR code in the center of the frame
            </Text>
          )}
        </View>

        {/* Scanned data display */}
        {scanned && scannedData && (
          <View style={styles.scannedDataContainer}>
            <Text style={styles.scannedDataTitle}>Scanned Data:</Text>
            <Text style={styles.scannedDataText} numberOfLines={3}>
              {scannedData}
            </Text>
          </View>
        )}

        {/* Scan again button */}
        {scanned && !isLoading && (
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              style={styles.scanAgainButton}
              onPress={handleScanAgain}
            >
              <Ionicons name="scan" size={24} color="#FFFFFF" />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator 
                size="large" 
                color={Colors[colorScheme ?? 'light'].primary} 
                style={styles.loadingSpinner}
              />
              <Text style={styles.loadingText}>Loading User Details</Text>
              <Text style={styles.loadingSubtext}>Please wait...</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

