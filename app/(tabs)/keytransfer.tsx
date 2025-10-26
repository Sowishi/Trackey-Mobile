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
import { database, off, onValue, push, ref, remove, update } from '../../firebase';

interface UserWithSchedule {
  rfid: string;
  name: string;
  scheduleCount: number;
  schedules: ScheduleItem[];
}

interface ScheduleItem {
  key: number;
  name_of_day?: string;
  start: number;
  end: number;
}

interface TransferRequest {
  id: string;
  fromUserRfid: string;
  fromUserName: string;
  toUserRfid: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'denied';
  timestamp: number;
}

export default function KeyTransferScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [usersWithSchedules, setUsersWithSchedules] = useState<UserWithSchedule[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    fetchUsersWithSchedules();
    fetchTransferRequests();
  }, [user]);

  const fetchUsersWithSchedules = () => {
    if (!user?.rfid) return;

    setLoading(true);
    const schedulesRef = ref(database, 'CNSHS-TRACKEY/schedules');
    
    onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('All schedules data:', data);
      
      if (data) {
        const usersWithSchedulesList: UserWithSchedule[] = [];
        
        // First, fetch all users to get their names
        const usersRef = ref(database, 'trackey/users');
        onValue(usersRef, (usersSnapshot) => {
          const usersData = usersSnapshot.val();
          const userMap: { [rfid: string]: string } = {};
          
          if (usersData) {
            Object.keys(usersData).forEach(userId => {
              const userData = usersData[userId];
              if (userData.rfid && userData.name) {
                userMap[userData.rfid] = userData.name;
              }
            });
          }
          
          // Now iterate through all users' schedules
          Object.keys(data).forEach(userRfid => {
            const userSchedules = data[userRfid];
            
            if (userSchedules) {
              const schedules: ScheduleItem[] = [];
              
              // Check if it's a single schedule or multiple schedules
              if (userSchedules.key !== undefined && userSchedules.start !== undefined && userSchedules.end !== undefined) {
                // Single schedule
                schedules.push({
                  key: userSchedules.key,
                  name_of_day: userSchedules.name_of_day || '',
                  start: userSchedules.start,
                  end: userSchedules.end
                });
              } else {
                // Multiple schedules
                Object.keys(userSchedules).forEach(scheduleKey => {
                  const schedule = userSchedules[scheduleKey];
                  if (schedule.start && schedule.end) {
                    schedules.push({
                      key: schedule.key || parseInt(scheduleKey),
                      name_of_day: schedule.name_of_day || '',
                      start: schedule.start,
                      end: schedule.end
                    });
                  }
                });
              }
              
              if (schedules.length > 0) {
                usersWithSchedulesList.push({
                  rfid: userRfid,
                  name: userMap[userRfid] || 'Unknown User',
                  scheduleCount: schedules.length,
                  schedules: schedules
                });
              }
            }
          });
          
          setUsersWithSchedules(usersWithSchedulesList);
          setLoading(false);
          setRefreshing(false);
          
          // Clean up users listener
          off(usersRef);
        }, (error) => {
          console.error('Error fetching users:', error);
          setUsersWithSchedules([]);
          setLoading(false);
          setRefreshing(false);
        });
      } else {
        setUsersWithSchedules([]);
        setLoading(false);
        setRefreshing(false);
      }
    }, (error) => {
      console.error('Error fetching schedules:', error);
      setUsersWithSchedules([]);
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
    fetchUsersWithSchedules();
    fetchTransferRequests();
  };

  const requestTransfer = (targetUser: UserWithSchedule) => {
    if (!user) return;

    // Check if user is requesting from themselves
    if (targetUser.rfid === user.rfid) {
      Alert.alert('Cannot Request', 'You cannot request transfer from yourself.');
      return;
    }

    // Check if there's already a pending request between these users
    const existingRequest = transferRequests.find(req => 
      req.status === 'pending' &&
      ((req.fromUserRfid === user.rfid && req.toUserRfid === targetUser.rfid) ||
       (req.fromUserRfid === targetUser.rfid && req.toUserRfid === user.rfid))
    );

    if (existingRequest) {
      Alert.alert('Request Exists', 'There is already a pending transfer request between you and this user.');
      return;
    }

    Alert.alert(
      'Request Transfer',
      `Are you sure you want to request transfer of ALL schedules from ${targetUser.name}? This will transfer ${targetUser.scheduleCount} schedule(s).`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: () => {
            const newRequest: Omit<TransferRequest, 'id'> = {
              fromUserRfid: targetUser.rfid,
              fromUserName: targetUser.name,
              toUserRfid: user.rfid,
              toUserName: user.name,
              status: 'pending',
              timestamp: Date.now()
            };

            const requestsRef = ref(database, 'CNSHS-TRACKEY/transferRequests');
            push(requestsRef, newRequest)
              .then(() => {
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

    // Check if current user is the sender (the one who has the schedules)
    if (request.fromUserRfid !== user.rfid) {
      Alert.alert('Unauthorized', 'Only the schedule holder can respond to transfer requests.');
      return;
    }

    const action = accept ? 'accept' : 'deny';
    const actionText = accept ? 'accept' : 'deny';

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Transfer`,
      `Are you sure you want to ${actionText} the transfer request to ${request.toUserName}?`,
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
                  // Transfer all schedules by moving from one RFID path to another
                  const fromScheduleRef = ref(database, `CNSHS-TRACKEY/schedules/${request.fromUserRfid}`);
                  const toScheduleRef = ref(database, `CNSHS-TRACKEY/schedules/${request.toUserRfid}`);
                  
                  // Get the schedules from the sender
                  onValue(fromScheduleRef, (snapshot) => {
                    const scheduleData = snapshot.val();
                    
                    if (scheduleData) {
                      // Move the entire schedule data to the receiver using update() to completely replace
                      update(toScheduleRef, scheduleData)
                        .then(() => {
                          // Remove the schedules from the sender
                          remove(fromScheduleRef)
                            .then(() => {
                              Alert.alert('Success', 'All schedules transferred successfully!');
                            })
                            .catch((error: any) => {
                              console.error('Error removing schedules from sender:', error);
                              Alert.alert('Error', 'Failed to complete transfer. Please try again.');
                            });
                        })
                        .catch((error: any) => {
                          console.error('Error transferring schedules:', error);
                          Alert.alert('Error', 'Failed to transfer schedules. Please try again.');
                        });
                    } else {
                      Alert.alert('Error', 'No schedules found to transfer.');
                    }
                    
                    off(fromScheduleRef);
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
    return transferRequests.filter(req => 
      req.status === 'pending' && 
      (req.fromUserRfid === user?.rfid || req.toUserRfid === user?.rfid)
    );
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
    schedulesPreview: {
      marginBottom: 16,
    },
    schedulePreviewItem: {
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    schedulePreviewText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].text,
      fontWeight: '500',
    },
    moreSchedulesText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 4,
    },
  });

  const pendingRequests = getPendingRequestsForUser();

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
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <ThemedText style={styles.requestTitle}>Transfer Request</ThemedText>
                    <ThemedText style={styles.requestStatus}>PENDING</ThemedText>
                  </View>
                  
                  <View style={styles.requestDetails}>
                    <ThemedText style={styles.requestText}>
                      {request.fromUserRfid === user.rfid 
                        ? `You requested schedules from ${request.toUserName}`
                        : `${request.fromUserName} requested schedules from you`
                      }
                    </ThemedText>
                  </View>

                  {request.fromUserRfid === user.rfid && (
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

          {/* Available Users Section */}
          <ThemedText style={styles.sectionTitle}>Users with Schedules</ThemedText>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator 
                size="large" 
                color={Colors[colorScheme ?? 'light'].primary} 
              />
              <ThemedText style={styles.loadingText}>Loading users...</ThemedText>
            </View>
          ) : usersWithSchedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="key-outline" 
                size={80} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>No Users with Schedules</ThemedText>
              <ThemedText style={styles.emptyText}>
                No users currently have schedules assigned.
              </ThemedText>
            </View>
          ) : (
            usersWithSchedules.map((userWithSchedule, index) => (
              <View key={userWithSchedule.rfid || index} style={styles.scheduleCard}>
                {/* User Header */}
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleKey}>
                    <ThemedText style={styles.scheduleKeyText}>{userWithSchedule.scheduleCount}</ThemedText>
                  </View>
                </View>

                {/* User Info */}
                <View style={styles.holderInfo}>
                  <Ionicons 
                    name="person-circle" 
                    size={20} 
                    color={Colors[colorScheme ?? 'light'].primary}
                    style={styles.holderIcon}
                  />
                  <ThemedText style={styles.holderText}>
                    {userWithSchedule.name} ({userWithSchedule.scheduleCount} schedule{userWithSchedule.scheduleCount > 1 ? 's' : ''})
                  </ThemedText>
                </View>

                {/* Schedule Preview */}
                <View style={styles.schedulesPreview}>
                  {userWithSchedule.schedules.slice(0, 2).map((schedule, scheduleIndex) => (
                    <View key={scheduleIndex} style={styles.schedulePreviewItem}>
                      <ThemedText style={styles.schedulePreviewText}>
                        Schedule #{schedule.key}: {formatTime(schedule.start)} - {formatTime(schedule.end)}
                      </ThemedText>
                    </View>
                  ))}
                  {userWithSchedule.schedules.length > 2 && (
                    <ThemedText style={styles.moreSchedulesText}>
                      +{userWithSchedule.schedules.length - 2} more schedule{userWithSchedule.schedules.length - 2 > 1 ? 's' : ''}
                    </ThemedText>
                  )}
                </View>

                {/* Request Button */}
                <TouchableOpacity 
                  style={styles.requestButton}
                  onPress={() => requestTransfer(userWithSchedule)}
                  disabled={userWithSchedule.rfid === user.rfid}
                >
                  <Ionicons name="swap-horizontal" size={20} color="white" />
                  <ThemedText style={styles.requestButtonText}>
                    {userWithSchedule.rfid === user.rfid ? 'You Hold These' : 'Request All Schedules'}
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