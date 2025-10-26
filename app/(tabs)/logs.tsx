import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database, off, onValue, ref } from '../../firebase';

interface LogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: string;
  user: string;
}

export default function LogsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    fetchLogs();
  }, [user]);

  const fetchLogs = () => {
    if (!user?.rfid) return;

    setLoading(true);
    const logsRef = ref(database, 'CNSHS-TRACKEY/logs');
    
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const logsArray: LogEntry[] = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .filter(log => log.type === "transfer" && log.user === user.name)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by newest first
        
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
      setLoading(false);
      setRefreshing(false);
    }, (error: any) => {
      console.error('Error fetching logs:', error);
      setLogs([]);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      off(logsRef);
    };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'REQUEST_TRANSFER':
        return 'swap-horizontal-outline';
      case 'TRANSFER_ACCEPTED':
        return 'checkmark-circle-outline';
      case 'TRANSFER_DENIED':
        return 'close-circle-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'REQUEST_TRANSFER':
        return '#FFA500';
      case 'TRANSFER_ACCEPTED':
        return '#4CAF50';
      case 'TRANSFER_DENIED':
        return '#F44336';
      default:
        return Colors[colorScheme ?? 'light'].primary;
    }
  };

  const getActionText = (action: string): string => {
    switch (action) {
      case 'REQUEST_TRANSFER':
        return 'Transfer Requested';
      case 'TRANSFER_ACCEPTED':
        return 'Transfer Accepted';
      case 'TRANSFER_DENIED':
        return 'Transfer Denied';
      default:
        return action;
    }
  };

  if (!user) {
    return null;
  }

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
    },
    header: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingTop: 60,
      paddingBottom: 30,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 10,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'white',
      textAlign: 'center',
      opacity: 0.9,
    },
    scrollContent: {
      padding: 20,
      paddingTop: 30,
      paddingBottom: 100,
    },
    logCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderLeftWidth: 4,
    },
    logHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    logIcon: {
      marginRight: 12,
    },
    logTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      flex: 1,
    },
    logTimestamp: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    logDetails: {
      marginBottom: 12,
    },
    logText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    logUsers: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    userIcon: {
      marginRight: 8,
    },
    userText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Logs</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Your schedule transfer history</ThemedText>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors[colorScheme ?? 'light'].primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator 
                size="large" 
                color={Colors[colorScheme ?? 'light'].primary} 
              />
              <ThemedText style={styles.loadingText}>Loading logs...</ThemedText>
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="document-text-outline" 
                size={80} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>No Logs Found</ThemedText>
              <ThemedText style={styles.emptyText}>
                Your transfer activity will appear here once you start using the key transfer feature.
              </ThemedText>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                {/* Log Header */}
                <View style={styles.logHeader}>
                  <Ionicons 
                    name={getActionIcon(log.action) as any} 
                    size={24} 
                    color={getActionColor(log.action)}
                    style={styles.logIcon}
                  />
                  <ThemedText style={styles.logTitle}>
                    {getActionText(log.action)}
                  </ThemedText>
                  <ThemedText style={styles.logTimestamp}>
                    {formatTimestamp(log.timestamp)}
                  </ThemedText>
                </View>

                {/* Log Details */}
                <View style={styles.logDetails}>
                  <ThemedText style={styles.logText}>{log.details}</ThemedText>
                </View>

                {/* User */}
                <View style={styles.logUsers}>
                  <Ionicons 
                    name="person-outline" 
                    size={16} 
                    color={Colors[colorScheme ?? 'light'].primary}
                    style={styles.userIcon}
                  />
                  <ThemedText style={styles.userText}>
                    User: {log.user}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}