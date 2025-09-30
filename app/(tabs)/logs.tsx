import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample log data
const sampleLogs = [
  {
    id: 'LOG001',
    timestamp: '2024-09-30T14:35:22Z',
    user: 'John Mitchell',
    action: 'Device Activated',
    target: 'GPS Tracker #247',
    location: 'Zone A - Building 1',
    status: 'success',
    details: 'Successfully activated GPS tracker for field deployment',
    category: 'device',
    severity: 'info'
  },
  {
    id: 'LOG002',
    timestamp: '2024-09-30T14:20:15Z',
    user: 'Sarah Johnson',
    action: 'Emergency Override',
    target: 'Security Gate KS002',
    location: 'Main Entrance',
    status: 'warning',
    details: 'Emergency lockdown system manually overridden due to fire drill',
    category: 'security',
    severity: 'warning'
  },
  {
    id: 'LOG003',
    timestamp: '2024-09-30T13:45:08Z',
    user: 'System Auto',
    action: 'Battery Alert',
    target: 'Tracker Device #189',
    location: 'Parking Lot B',
    status: 'warning',
    details: 'Battery level dropped below 25% threshold',
    category: 'maintenance',
    severity: 'warning'
  },
  {
    id: 'LOG004',
    timestamp: '2024-09-30T12:30:45Z',
    user: 'Mike Davis',
    action: 'Data Backup',
    target: 'System Database',
    location: 'Server Room',
    status: 'success',
    details: 'Scheduled backup completed successfully - 2.4GB archived',
    category: 'system',
    severity: 'info'
  },
  {
    id: 'LOG005',
    timestamp: '2024-09-30T11:15:33Z',
    user: 'Tom Wilson',
    action: 'Connection Failed',
    target: 'Remote Sensor #45',
    location: 'Downtown District',
    status: 'error',
    details: 'Failed to establish connection with remote sensor after 3 attempts',
    category: 'network',
    severity: 'error'
  },
  {
    id: 'LOG006',
    timestamp: '2024-09-30T10:22:17Z',
    user: 'John Mitchell',
    action: 'Schedule Updated',
    target: 'Maintenance Task #156',
    location: 'Maintenance Lab',
    status: 'success',
    details: 'Rescheduled equipment maintenance from 2:00 PM to 4:00 PM',
    category: 'schedule',
    severity: 'info'
  },
  {
    id: 'LOG007',
    timestamp: '2024-09-30T09:45:12Z',
    user: 'System Auto',
    action: 'Location Update',
    target: 'Mobile Unit #12',
    location: 'Highway 101',
    status: 'success',
    details: 'GPS coordinates updated: 37.7749° N, 122.4194° W',
    category: 'tracking',
    severity: 'info'
  },
  {
    id: 'LOG008',
    timestamp: '2024-09-30T08:30:55Z',
    user: 'Sarah Johnson',
    action: 'User Login',
    target: 'Trackey System',
    location: 'Office Terminal',
    status: 'success',
    details: 'User successfully authenticated and logged into system',
    category: 'auth',
    severity: 'info'
  },
  {
    id: 'LOG009',
    timestamp: '2024-09-30T07:15:28Z',
    user: 'System Auto',
    action: 'System Startup',
    target: 'Trackey Core',
    location: 'Server Room',
    status: 'success',
    details: 'System initialization completed - all services online',
    category: 'system',
    severity: 'info'
  },
  {
    id: 'LOG010',
    timestamp: '2024-09-29T23:45:03Z',
    user: 'Night Shift',
    action: 'Security Scan',
    target: 'All Zones',
    location: 'Facility Wide',
    status: 'success',
    details: 'Completed nightly security scan - no anomalies detected',
    category: 'security',
    severity: 'info'
  }
];

export default function LogsScreen() {
  const colorScheme = useColorScheme();
  const [logs, setLogs] = useState(sampleLogs);
  const [filteredLogs, setFilteredLogs] = useState(sampleLogs);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['all', 'device', 'security', 'maintenance', 'system', 'network', 'schedule', 'tracking', 'auth'];
  const severities = ['all', 'info', 'warning', 'error'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return Colors[colorScheme ?? 'light'].primary;
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return Colors[colorScheme ?? 'light'].primary;
      case 'warning': return '#F59E0B';
      case 'info': return '#10B981';
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'device': return 'hardware-chip-outline';
      case 'security': return 'shield-checkmark-outline';
      case 'maintenance': return 'construct-outline';
      case 'system': return 'server-outline';
      case 'network': return 'wifi-outline';
      case 'schedule': return 'calendar-outline';
      case 'tracking': return 'location-outline';
      case 'auth': return 'person-outline';
      default: return 'document-text-outline';
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(log => log.severity === selectedSeverity);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(query) ||
        log.target.toLowerCase().includes(query) ||
        log.user.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.location.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    filterLogs();
  }, [selectedCategory, selectedSeverity, searchQuery, logs]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    filtersContainer: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    filterGroup: {
      flex: 1,
      marginRight: 8,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
      color: Colors[colorScheme ?? 'light'].primary,
    },
    filterSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    filterButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      marginRight: 4,
      marginBottom: 4,
    },
    selectedFilterButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    filterButtonText: {
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    selectedFilterButtonText: {
      color: 'white',
    },
    scrollContent: {
      padding: 20,
    },
    logCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    logAction: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
      marginRight: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 60,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '500',
      color: 'white',
      textTransform: 'capitalize',
    },
    logMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
      marginBottom: 4,
    },
    metaText: {
      fontSize: 12,
      marginLeft: 4,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    logDetails: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    logFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    userName: {
      fontSize: 12,
      marginLeft: 4,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    timestamp: {
      fontSize: 11,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      marginTop: 16,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
    },
    resultsCount: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>User Logs</ThemedText>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons 
              name="search-outline" 
              size={20} 
              color={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search logs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filter */}
          <View style={styles.filterGroup}>
            <ThemedText style={styles.filterLabel}>Category</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterSelector}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterButton,
                      selectedCategory === category && styles.selectedFilterButton
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <ThemedText style={[
                      styles.filterButtonText,
                      selectedCategory === category && styles.selectedFilterButtonText
                    ]}>
                      {category}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Severity Filter */}
          <View style={styles.filterGroup}>
            <ThemedText style={styles.filterLabel}>Severity</ThemedText>
            <View style={styles.filterSelector}>
              {severities.map(severity => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.filterButton,
                    selectedSeverity === severity && styles.selectedFilterButton
                  ]}
                  onPress={() => setSelectedSeverity(severity)}
                >
                  <ThemedText style={[
                    styles.filterButtonText,
                    selectedSeverity === severity && styles.selectedFilterButtonText
                  ]}>
                    {severity}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

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
          {filteredLogs.length > 0 && (
            <ThemedText style={styles.resultsCount}>
              Showing {filteredLogs.length} of {logs.length} logs
            </ThemedText>
          )}

          {filteredLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="document-text-outline" 
                size={60} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
              <ThemedText style={styles.emptyText}>
                No logs found matching your criteria
              </ThemedText>
            </View>
          ) : (
            filteredLogs.map(log => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <ThemedText style={styles.logAction}>{log.action}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(log.status) }]}>
                    <ThemedText style={styles.statusText}>{log.status}</ThemedText>
                  </View>
                </View>

                <View style={styles.logMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name={getCategoryIcon(log.category)} 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.metaText}>{log.category}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name="hardware-chip-outline" 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.metaText}>{log.target}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name="location-outline" 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.metaText}>{log.location}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: getSeverityColor(log.severity) + '20',
                        borderWidth: 1,
                        borderColor: getSeverityColor(log.severity),
                        minWidth: 40
                      }
                    ]}>
                      <ThemedText style={[
                        styles.statusText,
                        { color: getSeverityColor(log.severity) }
                      ]}>
                        {log.severity}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <ThemedText style={styles.logDetails}>{log.details}</ThemedText>

                <View style={styles.logFooter}>
                  <View style={styles.userInfo}>
                    <Ionicons 
                      name="person-outline" 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].primary}
                    />
                    <ThemedText style={styles.userName}>{log.user}</ThemedText>
                  </View>
                  <ThemedText style={styles.timestamp}>
                    {formatTimestamp(log.timestamp)}
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
