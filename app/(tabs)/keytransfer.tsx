import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database, get, off, onValue, push, ref, update } from '../../firebase';

interface ScheduleItem {
  key: number;
  name_of_day?: string;
  start: number;
  end: number;
  currentHolderRfid: string;
  currentHolderName: string;
  rfid?: string;
}

interface TransferRequest {
  id: string;
  scheduleKey: number;
  requesterRfid: string;
  requesterName: string;
  currentHolderRfid: string;
  currentHolderName: string;
  status: 'pending' | 'accepted' | 'denied';
  timestamp: number;
}

export default function KeyTransferScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    fetchAllSchedules();
    fetchTransferRequests();
  }, [user]);

  const fetchAllSchedules = () => {
    if (!user?.rfid) return;

    setLoading(true);
    const schedulesRef = ref(database, 'CNSHS-TRACKEY/schedules');
    
    onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('All schedules data:', data);
      
      if (data) {
        const allSchedules: ScheduleItem[] = [];
        
        // Iterate through all users' schedules
        Object.keys(data).forEach(userRfid => {
          const userSchedules = data[userRfid];
          
          if (userSchedules) {
            // Check if it's a single schedule or multiple schedules
            if (userSchedules.key !== undefined && userSchedules.start !== undefined && userSchedules.end !== undefined) {
              // Single schedule
              allSchedules.push({
                key: userSchedules.key,
                name_of_day: userSchedules.name_of_day || '',
                start: userSchedules.start,
                end: userSchedules.end,
                currentHolderRfid: userRfid,
                currentHolderName: userSchedules.currentHolderName || 'Unknown User',
                rfid: userSchedules.rfid || userRfid
              });
            } else {
              // Multiple schedules
              Object.keys(userSchedules).forEach(scheduleKey => {
                const schedule = userSchedules[scheduleKey];
                if (schedule.start && schedule.end) {
                  allSchedules.push({
                    key: schedule.key || parseInt(scheduleKey),
                    name_of_day: schedule.name_of_day || '',
                    start: schedule.start,
                    end: schedule.end,
                    currentHolderRfid: userRfid,
                    currentHolderName: schedule.currentHolderName || 'Unknown User',
                    rfid: schedule.rfid || userRfid
                  });
                }
              });
            }
          }
        });
        
        // Filter out the current user's own schedules
        const filteredSchedules = allSchedules.filter(schedule => 
          schedule.rfid !== user.rfid
        );
        
        setSchedules(filteredSchedules);
        setLoading(false);
        setRefreshing(false);
      } else {
        setSchedules([]);
        setLoading(false);
        setRefreshing(false);
      }
    }, (error: any) => {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      off(schedulesRef);
    };
  };

  const fetchTransferRequests = () => {
    if (!user?.rfid) return;

    const requestsRef = ref(database, 'CNSHS-TRACKEY/transferRequests');
    
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const requests: TransferRequest[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTransferRequests(requests);
      } else {
        setTransferRequests([]);
      }
    }, (error) => {
      console.error('Error fetching transfer requests:', error);
      setTransferRequests([]);
    });

    return () => {
      off(requestsRef);
    };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllSchedules();
    fetchTransferRequests();
  };

  const requestTransfer = (schedule: ScheduleItem) => {
    if (!user) return;

    // Check if user is already the holder
    if (schedule.currentHolderRfid === user.rfid) {
      Alert.alert('Cannot Request', 'You already hold this schedule.');
      return;
    }

    // Check if there's already a pending request for this schedule
    const existingRequest = transferRequests.find(req => 
      req.scheduleKey === schedule.key && 
      req.status === 'pending' &&
      (req.requesterRfid === user.rfid || req.currentHolderRfid === user.rfid)
    );

    if (existingRequest) {
      Alert.alert('Request Exists', 'There is already a pending request for this schedule.');
      return;
    }

    Alert.alert(
      'Request Transfer',
      `Are you sure you want to request transfer of Schedule #${schedule.key} from ${schedule.currentHolderName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: () => {
            const newRequest: Omit<TransferRequest, 'id'> = {
              scheduleKey: schedule.key,
              requesterRfid: user.rfid,
              requesterName: user.name,
              currentHolderRfid: schedule.rfid || '',
              currentHolderName: schedule.currentHolderName,
              status: 'pending',
              timestamp: Date.now()
            };

            console.log('Creating transfer request:', newRequest);
            console.log('Schedule currentHolderRfid:', schedule.currentHolderRfid);
            console.log('User RFID:', user.rfid);

            const requestsRef = ref(database, 'CNSHS-TRACKEY/transferRequests');
            push(requestsRef, newRequest)
              .then(() => {
                // Log the transfer request
                logTransferActivity(
                  'REQUEST_TRANSFER',
                  schedule.currentHolderName,
                  user.name,
                  `Requested transfer of Schedule #${schedule.key}`
                );
                Alert.alert('Success', 'Transfer request sent successfully!');
              })
              .catch((error: any) => {
                console.error('Error creating transfer request:', error);
                Alert.alert('Error', 'Failed to send transfer request. Please try again.');
              });
          }
        }
      ]
    );
  };

  const handleTransferResponse = (request: TransferRequest, accept: boolean) => {
    if (!user) return;

    // Check if current user is the holder
    if (request.currentHolderRfid !== user.rfid) {
      Alert.alert('Unauthorized', 'Only the current holder can respond to transfer requests.');
      return;
    }

    const action = accept ? 'accept' : 'deny';
    const actionText = accept ? 'accept' : 'deny';

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Transfer`,
      `Are you sure you want to ${actionText} the transfer request for Schedule #${request.scheduleKey}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1), 
          onPress: () => {
            const requestRef = ref(database, `CNSHS-TRACKEY/transferRequests/${request.id}`);
            
            if (accept) {
              // Update request status to accepted
              update(requestRef, { status: 'accepted' })
                .then(() => {
                  // Find the schedule by searching through all schedules
                  const allSchedulesRef = ref(database, 'CNSHS-TRACKEY/schedules');
                  
                  get(allSchedulesRef)
                    .then((snapshot) => {
                      const allSchedulesData = snapshot.val();
                      let scheduleToTransfer: any = null;
                      let holderRfid: string = '';
                      let scheduleKeyToRemove: string | null = null;
                      
                      if (allSchedulesData) {
                        // Search through all users' schedules to find the specific schedule
                        Object.keys(allSchedulesData).forEach(userRfid => {
                          const userSchedules = allSchedulesData[userRfid];
                          
                          if (userSchedules) {
                            if (userSchedules.key === request.scheduleKey) {
                              // Single schedule case
                              scheduleToTransfer = userSchedules;
                              holderRfid = userRfid;
                              scheduleKeyToRemove = null;
                            } else {
                              // Multiple schedules case
                              Object.keys(userSchedules).forEach(key => {
                                if (userSchedules[key].key === request.scheduleKey) {
                                  scheduleToTransfer = userSchedules[key];
                                  holderRfid = userRfid;
                                  scheduleKeyToRemove = key;
                                }
                              });
                            }
                          }
                        });
                      }
                        
                      if (scheduleToTransfer) {
                        // Update the schedule with new holder information in place
                        const updatedSchedule = {
                          ...scheduleToTransfer,
                          rfid: request.requesterRfid,
                          currentHolderName: request.requesterName
                        };
                        
                        // Update the schedule in its current location
                        if (scheduleKeyToRemove === null) {
                          // Single schedule case - update the entire schedule node
                          const currentHolderScheduleRef = ref(database, `CNSHS-TRACKEY/schedules/${holderRfid}`);
                          update(currentHolderScheduleRef, updatedSchedule)
                            .then(() => {
                              // Log the successful transfer
                              logTransferActivity(
                                'TRANSFER_ACCEPTED',
                                request.currentHolderName,
                                request.requesterName,
                                `Successfully transferred Schedule #${request.scheduleKey}`
                              );
                              Alert.alert('Success', 'Schedule transferred successfully!');
                            })
                            .catch((error: any) => {
                              console.error('Error updating schedule:', error);
                              Alert.alert('Error', 'Failed to update schedule. Please try again.');
                            });
                        } else {
                          // Multiple schedules case - update the specific schedule
                          const specificScheduleRef = ref(database, `CNSHS-TRACKEY/schedules/${holderRfid}/${scheduleKeyToRemove}`);
                          update(specificScheduleRef, updatedSchedule)
                            .then(() => {
                              // Log the successful transfer
                              logTransferActivity(
                                'TRANSFER_ACCEPTED',
                                request.currentHolderName,
                                request.requesterName,
                                `Successfully transferred Schedule #${request.scheduleKey}`
                              );
                              Alert.alert('Success', 'Schedule transferred successfully!');
                            })
                            .catch((error: any) => {
                              console.error('Error updating schedule:', error);
                              Alert.alert('Error', 'Failed to update schedule. Please try again.');
                            });
                        }
                      } else {
                        Alert.alert('Error', 'Schedule not found.');
                      }
                    })
                    .catch((error: any) => {
                      console.error('Error getting schedule data:', error);
                      Alert.alert('Error', 'Failed to get schedule data. Please try again.');
                    });
                })
                .catch((error: any) => {
                  console.error('Error updating request:', error);
                  Alert.alert('Error', 'Failed to update request. Please try again.');
                });
            } else {
              // Update request status to denied
              update(requestRef, { status: 'denied' })
                .then(() => {
                  // Log the denied transfer
                  logTransferActivity(
                    'TRANSFER_DENIED',
                    request.currentHolderName,
                    request.requesterName,
                    `Transfer request for Schedule #${request.scheduleKey} was denied`
                  );
                  Alert.alert('Success', 'Transfer request denied.');
                })
                .catch((error: any) => {
                  console.error('Error updating request:', error);
                  Alert.alert('Error', 'Failed to update request. Please try again.');
                });
            }
          }
        }
      ]
    );
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
  

  const getPendingRequestsForUser = () => {
    const filtered = transferRequests.filter(req => 
      req.status === 'pending' && 
      (req.requesterRfid === user?.rfid || req.currentHolderRfid === user?.rfid)
    );
    console.log('Pending requests for user:', filtered);
    console.log('Current user RFID:', user?.rfid);
    return filtered;
  };

  const logTransferActivity = (action: string, fromUser: string, toUser: string, details: string) => {
    if (!user) return;

    const logEntry = {
      action,
      fromUser,
      toUser,
      details,
      timestamp: Date.now(),
      is_mobile: true,
      owner: user.rfid
    };

    const logsRef = ref(database, 'CNSHS-TRACKEY/logs');
    push(logsRef, logEntry)
      .catch((error: any) => {
        console.error('Error logging transfer activity:', error);
      });
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
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 16,
      marginTop: 20,
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
    holderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    holderIcon: {
      marginRight: 8,
    },
    holderText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '500',
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
      marginBottom: 16,
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
    requestButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    requestCard: {
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
      borderLeftColor: '#FFA500',
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    requestTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    requestStatus: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFA500',
      backgroundColor: '#FFA50020',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    requestDetails: {
      marginBottom: 16,
    },
    requestText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    acceptButton: {
      backgroundColor: '#4CAF50',
    },
    denyButton: {
      backgroundColor: '#F44336',
    },
    actionButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
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

  const pendingRequests = getPendingRequestsForUser();


  console.log(user.rfid);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Key Transfer</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Request or manage schedule transfers</ThemedText>
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
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <>
              <ThemedText style={styles.sectionTitle}>Pending Requests</ThemedText>
              {pendingRequests.map((request: TransferRequest) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <ThemedText style={styles.requestTitle}>Transfer Request</ThemedText>
                    <ThemedText style={styles.requestStatus}>PENDING</ThemedText>
                  </View>
                  
                  <View style={styles.requestDetails}>
                    <ThemedText style={styles.requestText}>
                      {request.requesterRfid === user.rfid 
                        ? `You requested Schedule #${request.scheduleKey} from ${request.currentHolderName}`
                        : `${request.requesterName} requested Schedule #${request.scheduleKey} from you`
                      }
                    </ThemedText>
                  </View>

                  {request.currentHolderRfid === user.rfid && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleTransferResponse(request, true)}
                      >
                        <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.denyButton]}
                        onPress={() => handleTransferResponse(request, false)}
                      >
                        <ThemedText style={styles.actionButtonText}>Deny</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Available Schedules Section */}
          <ThemedText style={styles.sectionTitle}>Available Schedules</ThemedText>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator 
                size="large" 
                color={Colors[colorScheme ?? 'light'].primary} 
              />
              <ThemedText style={styles.loadingText}>Loading schedules...</ThemedText>
            </View>
          ) : schedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="key-outline" 
                size={80} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>No Schedules Available</ThemedText>
              <ThemedText style={styles.emptyText}>
                No schedules are currently available for transfer.
              </ThemedText>
            </View>
          ) : (
            schedules.map((schedule, index) => (
              <View key={schedule.key || index} style={styles.scheduleCard}>
                {/* Schedule Header */}
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleKey}>
                    <ThemedText style={styles.scheduleKeyText}>#{schedule.key}</ThemedText>
                  </View>
                </View>

                {/* Current Holder */}
                <View style={styles.holderInfo}>
                  <Ionicons 
                    name="person-circle" 
                    size={20} 
                    color={Colors[colorScheme ?? 'light'].primary}
                    style={styles.holderIcon}
                  />
                  <ThemedText style={styles.holderText}>
                    Current Holder: {schedule.currentHolderName}
                  </ThemedText>
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

                {/* Request Button */}
                <TouchableOpacity 
                  style={styles.requestButton}
                  onPress={() => requestTransfer(schedule)}
                  disabled={schedule.currentHolderRfid === user.rfid}
                >
                  <Ionicons name="swap-horizontal" size={20} color="white" />
                  <ThemedText style={styles.requestButtonText}>
                    {schedule.currentHolderRfid === user.rfid ? 'You Hold This' : 'Request Transfer'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}