import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample schedule data
const sampleSchedule = [
  {
    id: 'SCH001',
    title: 'Morning Device Check',
    description: 'Routine inspection of all tracking devices in Zone A',
    date: '2024-09-30',
    time: '08:00',
    duration: 60,
    status: 'completed',
    priority: 'medium',
    location: 'Zone A - Building 1',
    assignedTo: 'John Mitchell',
    type: 'inspection'
  },
  {
    id: 'SCH002',
    title: 'Client Meeting - TechCorp',
    description: 'Discuss new tracking requirements and system integration',
    date: '2024-09-30',
    time: '10:30',
    duration: 90,
    status: 'in-progress',
    priority: 'high',
    location: 'Conference Room B',
    assignedTo: 'John Mitchell',
    type: 'meeting'
  },
  {
    id: 'SCH003',
    title: 'Equipment Maintenance',
    description: 'Scheduled maintenance for GPS trackers batch #247',
    date: '2024-09-30',
    time: '14:00',
    duration: 120,
    status: 'pending',
    priority: 'high',
    location: 'Maintenance Lab',
    assignedTo: 'John Mitchell',
    type: 'maintenance'
  },
  {
    id: 'SCH004',
    title: 'Field Survey - Downtown',
    description: 'Survey new tracking locations for urban deployment',
    date: '2024-10-01',
    time: '09:00',
    duration: 180,
    status: 'pending',
    priority: 'medium',
    location: 'Downtown District',
    assignedTo: 'John Mitchell',
    type: 'survey'
  },
  {
    id: 'SCH005',
    title: 'Training Session',
    description: 'New team member orientation on tracking protocols',
    date: '2024-10-01',
    time: '13:00',
    duration: 120,
    status: 'pending',
    priority: 'low',
    location: 'Training Room',
    assignedTo: 'John Mitchell',
    type: 'training'
  },
  {
    id: 'SCH006',
    title: 'System Backup',
    description: 'Weekly backup of all tracking data and configurations',
    date: '2024-10-02',
    time: '18:00',
    duration: 45,
    status: 'pending',
    priority: 'medium',
    location: 'Server Room',
    assignedTo: 'System',
    type: 'system'
  }
];

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const [schedule, setSchedule] = useState(sampleSchedule);
  const [selectedDate, setSelectedDate] = useState('2024-09-30');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: selectedDate,
    time: '09:00',
    duration: 60,
    priority: 'medium',
    location: '',
    type: 'inspection'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors[colorScheme ?? 'light'].primary;
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection': return 'search-outline';
      case 'meeting': return 'people-outline';
      case 'maintenance': return 'construct-outline';
      case 'survey': return 'map-outline';
      case 'training': return 'school-outline';
      case 'system': return 'server-outline';
      default: return 'calendar-outline';
    }
  };

  const filteredSchedule = schedule.filter(item => item.date === selectedDate);

  const handleAddTask = () => {
    const newId = `SCH${String(schedule.length + 1).padStart(3, '0')}`;
    const task = {
      ...newTask,
      id: newId,
      status: 'pending',
      assignedTo: 'John Mitchell'
    };
    
    setSchedule([...schedule, task]);
    setNewTask({
      title: '',
      description: '',
      date: selectedDate,
      time: '09:00',
      duration: 60,
      priority: 'medium',
      location: '',
      type: 'inspection'
    });
    setShowAddModal(false);
    Alert.alert('Success', 'Task added successfully!');
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setSchedule(schedule.map(item => 
      item.id === taskId ? { ...item, status: newStatus } : item
    ));
  };

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
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
    },
    dateButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    selectedDateButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    dateButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    selectedDateButtonText: {
      color: 'white',
    },
    scrollContent: {
      padding: 20,
    },
    taskCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
      marginRight: 8,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 60,
      alignItems: 'center',
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '500',
      color: 'white',
      textTransform: 'uppercase',
    },
    taskMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    metaText: {
      fontSize: 12,
      marginLeft: 4,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    taskDescription: {
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    taskFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    locationText: {
      fontSize: 12,
      marginLeft: 4,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    statusButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    statusButtonText: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    addButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
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
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: Colors[colorScheme ?? 'light'].primary,
    },
    input: {
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    primaryButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
    },
    secondaryButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    modalButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const dates = ['2024-09-30', '2024-10-01', '2024-10-02'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Schedule</ThemedText>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          {dates.map(date => (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateButton,
                selectedDate === date && styles.selectedDateButton
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <ThemedText style={[
                styles.dateButtonText,
                selectedDate === date && styles.selectedDateButtonText
              ]}>
                {formatDate(date)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {filteredSchedule.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="calendar-outline" 
                size={60} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
              <ThemedText style={styles.emptyText}>
                No tasks scheduled for this date
              </ThemedText>
            </View>
          ) : (
            filteredSchedule.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                    <ThemedText style={styles.priorityText}>{task.priority}</ThemedText>
                  </View>
                </View>

                <View style={styles.taskMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name={getTypeIcon(task.type)} 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.metaText}>{task.type}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name="time-outline" 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.metaText}>{formatTime(task.time)}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name="hourglass-outline" 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.metaText}>{task.duration}min</ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.taskDescription}>{task.description}</ThemedText>

                <View style={styles.taskFooter}>
                  <View style={styles.locationContainer}>
                    <Ionicons 
                      name="location-outline" 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.locationText}>{task.location}</ThemedText>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { 
                        backgroundColor: getStatusColor(task.status) + '20',
                        borderColor: getStatusColor(task.status)
                      }
                    ]}
                    onPress={() => {
                      const nextStatus = task.status === 'pending' ? 'in-progress' : 
                                       task.status === 'in-progress' ? 'completed' : 'pending';
                      handleStatusChange(task.id, nextStatus);
                    }}
                  >
                    <ThemedText style={[
                      styles.statusButtonText,
                      { color: getStatusColor(task.status) }
                    ]}>
                      {task.status.replace('-', ' ')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        {/* Add Task Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Add New Task</ThemedText>
              
              <ScrollView>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Title</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={newTask.title}
                    onChangeText={(text) => setNewTask({...newTask, title: text})}
                    placeholder="Enter task title"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Description</ThemedText>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newTask.description}
                    onChangeText={(text) => setNewTask({...newTask, description: text})}
                    placeholder="Enter task description"
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Location</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={newTask.location}
                    onChangeText={(text) => setNewTask({...newTask, location: text})}
                    placeholder="Enter location"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Time</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={newTask.time}
                    onChangeText={(text) => setNewTask({...newTask, time: text})}
                    placeholder="HH:MM"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={handleAddTask}
                >
                  <ThemedText style={styles.modalButtonText}>Add Task</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
