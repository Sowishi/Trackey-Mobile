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

interface ScheduleItem {
  key: number;
  name_of_day?: string;
  start: number;
  end: number;
}

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    fetchSchedule();
  }, [user]);

  const fetchSchedule = () => {
    if (!user?.rfid) return;

    setLoading(true);
    const allSchedulesRef = ref(database, 'CNSHS-TRACKEY/schedules');
    
    onValue(allSchedulesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('All schedules data:', data);
      
      if (data) {
        const userSchedules: ScheduleItem[] = [];
        
        // Search through all users' schedules to find schedules where current user is the holder
        Object.keys(data).forEach(userRfid => {
          const userSchedulesData = data[userRfid];
          
          if (userSchedulesData) {
            // Check if it's a single schedule or multiple schedules
            if (userSchedulesData.key !== undefined && userSchedulesData.start !== undefined && userSchedulesData.end !== undefined) {
              // Single schedule case
              if (userSchedulesData.rfid === user.rfid) {
                userSchedules.push({
                  key: userSchedulesData.key,
                  name_of_day: userSchedulesData.name_of_day || '',
                  start: userSchedulesData.start,
                  end: userSchedulesData.end
                });
              }
            } else {
              // Multiple schedules case
              Object.keys(userSchedulesData).forEach(scheduleKey => {
                const schedule = userSchedulesData[scheduleKey];
                if (schedule.start && schedule.end && schedule.rfid === user.rfid) {
                  userSchedules.push({
                    key: schedule.key || parseInt(scheduleKey),
                    name_of_day: schedule.name_of_day || '',
                    start: schedule.start,
                    end: schedule.end
                  });
                }
              });
            }
          }
        });
        
        setSchedules(userSchedules);
      } else {
        setSchedules([]);
      }
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
      setLoading(false);
      setRefreshing(false);
    });

    // Cleanup function
    return () => {
      off(allSchedulesRef);
    };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const formatTime = (militaryTime: number): string => {
    const hours = Math.floor(militaryTime / 100);
    const minutes = militaryTime % 100;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const parseDays = (dayString: string | undefined): string[] => {
    if (!dayString) return [];
    return dayString.split(',').map(dayIndex => {
      const index = parseInt(dayIndex);
      return dayNames[index] || `Day ${index}`;
    }).filter(Boolean);
  };

  const getDayColor = (dayIndex: string | undefined): string => {
    if (!dayIndex) return Colors[colorScheme ?? 'light'].primary;
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
    ];
    const index = parseInt(dayIndex);
    return colors[index] || Colors[colorScheme ?? 'light'].primary;
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
    scheduleCard: {
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
      borderLeftColor: Colors[colorScheme ?? 'light'].primary,
    },
    scheduleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    scheduleKey: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      minWidth: 40,
      alignItems: 'center',
    },
    scheduleKeyText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    timeBox: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginRight: 12,
    },
    timeLabel: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontWeight: '500',
      marginBottom: 4,
    },
    timeText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    arrow: {
      marginHorizontal: 8,
    },
    daysContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dayChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 4,
    },
    dayText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
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
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      marginHorizontal: 20,
      marginTop: -15,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    userInfoText: {
      marginLeft: 12,
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    userRfid: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 2,
    },
    instructionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      marginHorizontal: 20,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    instructionText: {
      marginLeft: 12,
      fontSize: 14,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].primary,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Key Access Schedule</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Your authorized access times</ThemedText>
        </View>

        {/* User Info Card */}
        <View style={styles.userInfo}>
          <Ionicons 
            name="person-circle" 
            size={40} 
            color={Colors[colorScheme ?? 'light'].primary}
          />
          <View style={styles.userInfoText}>
            <ThemedText style={styles.userName}>{user.name}</ThemedText>
            <ThemedText style={styles.userRfid}>RFID: {user.rfid}</ThemedText>
          </View>
        </View>

      

        {/* Schedule Content */}
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
              <ThemedText style={styles.loadingText}>Loading your access schedule...</ThemedText>
            </View>
          ) : schedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="key-outline" 
                size={80} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>No Access Schedule Found</ThemedText>
              <ThemedText style={styles.emptyText}>
                Your key access schedule will appear here once it's been set up in the system.
              </ThemedText>
            </View>
          ) : (
            schedules.map((schedule, index) => (
              <View key={schedule.key || index} style={styles.scheduleCard}>
                {/* Schedule Header */}
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleKey}>
                    <ThemedText style={styles.scheduleKeyText}>Key Slot #{schedule.key}</ThemedText>
                  </View>
                </View>

                {/* Time Information */}
                <View style={styles.timeContainer}>
                  <View style={styles.timeBox}>
                    <ThemedText style={styles.timeLabel}>START TIME</ThemedText>
                    <ThemedText style={styles.timeText}>{formatTime(schedule.start)}</ThemedText>
                  </View>
                  
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={Colors[colorScheme ?? 'light'].primary}
                    style={styles.arrow}
                  />
                  
                  <View style={styles.timeBox}>
                    <ThemedText style={styles.timeLabel}>END TIME</ThemedText>
                    <ThemedText style={styles.timeText}>{formatTime(schedule.end)}</ThemedText>
                  </View>
                </View>

                {/* Days */}
                <View style={styles.daysContainer}>
                  {parseDays(schedule.name_of_day).map((day, dayIndex) => {
                    const dayIndices = schedule.name_of_day?.split(',') || [];
                    const currentDayIndex = dayIndices[dayIndex];
                    return (
                      <View 
                        key={dayIndex} 
                        style={[
                          styles.dayChip, 
                          { backgroundColor: getDayColor(currentDayIndex) }
                        ]}
                      >
                        <ThemedText style={styles.dayText}>{day}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
