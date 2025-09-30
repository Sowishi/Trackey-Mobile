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
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample key switch data
const sampleKeySwitches = [
  {
    id: 'KS001',
    name: 'Main Security Gate',
    description: 'Primary entrance security control',
    location: 'Building A - Main Entrance',
    status: 'active',
    isEnabled: true,
    lastToggled: '2024-09-30T08:15:00Z',
    toggledBy: 'John Mitchell',
    category: 'security',
    priority: 'high',
    batteryLevel: 95,
    signalStrength: 4
  },
  {
    id: 'KS002',
    name: 'Emergency Lockdown',
    description: 'Emergency facility lockdown system',
    location: 'Control Room',
    status: 'standby',
    isEnabled: false,
    lastToggled: '2024-09-29T16:30:00Z',
    toggledBy: 'Sarah Johnson',
    category: 'emergency',
    priority: 'critical',
    batteryLevel: 88,
    signalStrength: 5
  },
  {
    id: 'KS003',
    name: 'Parking Barrier',
    description: 'Automated parking access control',
    location: 'Parking Lot A',
    status: 'active',
    isEnabled: true,
    lastToggled: '2024-09-30T07:45:00Z',
    toggledBy: 'System Auto',
    category: 'access',
    priority: 'medium',
    batteryLevel: 72,
    signalStrength: 3
  },
  {
    id: 'KS004',
    name: 'Server Room Access',
    description: 'Secure server room entry control',
    location: 'Building B - Floor 2',
    status: 'active',
    isEnabled: true,
    lastToggled: '2024-09-30T09:20:00Z',
    toggledBy: 'Mike Davis',
    category: 'security',
    priority: 'high',
    batteryLevel: 91,
    signalStrength: 4
  },
  {
    id: 'KS005',
    name: 'Loading Dock Gate',
    description: 'Cargo loading area access control',
    location: 'Warehouse - Loading Bay',
    status: 'maintenance',
    isEnabled: false,
    lastToggled: '2024-09-28T14:10:00Z',
    toggledBy: 'Tom Wilson',
    category: 'access',
    priority: 'low',
    batteryLevel: 45,
    signalStrength: 2
  },
  {
    id: 'KS006',
    name: 'Fire Safety Override',
    description: 'Fire safety system override control',
    location: 'Fire Control Panel',
    status: 'standby',
    isEnabled: false,
    lastToggled: '2024-09-25T11:00:00Z',
    toggledBy: 'Fire System',
    category: 'emergency',
    priority: 'critical',
    batteryLevel: 98,
    signalStrength: 5
  }
];

export default function KeySwitchScreen() {
  const colorScheme = useColorScheme();
  const [keySwitches, setKeySwitches] = useState(sampleKeySwitches);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeySwitch, setNewKeySwitch] = useState({
    name: '',
    description: '',
    location: '',
    category: 'access',
    priority: 'medium'
  });

  const categories = ['all', 'security', 'access', 'emergency'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'standby': return '#F59E0B';
      case 'maintenance': return Colors[colorScheme ?? 'light'].primary;
      case 'offline': return '#6B7280';
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return Colors[colorScheme ?? 'light'].primary;
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return 'shield-checkmark-outline';
      case 'access': return 'key-outline';
      case 'emergency': return 'warning-outline';
      default: return 'toggle-outline';
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 75) return 'battery-full-outline';
    if (level > 50) return 'battery-half-outline';
    if (level > 25) return 'battery-dead-outline';
    return 'battery-dead-outline';
  };

  const getSignalBars = (strength: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <View
        key={i}
        style={[
          styles.signalBar,
          {
            backgroundColor: i < strength 
              ? Colors[colorScheme ?? 'light'].primary 
              : Colors[colorScheme ?? 'light'].border,
            height: 4 + (i * 2)
          }
        ]}
      />
    ));
  };

  const filteredKeySwitches = selectedCategory === 'all' 
    ? keySwitches 
    : keySwitches.filter(ks => ks.category === selectedCategory);

  const handleToggleSwitch = (id: string, newValue: boolean) => {
    const keySwitch = keySwitches.find(ks => ks.id === id);
    if (!keySwitch) return;

    if (keySwitch.category === 'emergency' && newValue) {
      Alert.alert(
        'Emergency System',
        'Are you sure you want to activate the emergency system?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Activate', 
            style: 'destructive',
            onPress: () => updateKeySwitch(id, newValue)
          }
        ]
      );
    } else {
      updateKeySwitch(id, newValue);
    }
  };

  const updateKeySwitch = (id: string, isEnabled: boolean) => {
    setKeySwitches(keySwitches.map(ks => 
      ks.id === id 
        ? { 
            ...ks, 
            isEnabled, 
            status: isEnabled ? 'active' : 'standby',
            lastToggled: new Date().toISOString(),
            toggledBy: 'John Mitchell'
          } 
        : ks
    ));
  };

  const handleAddKeySwitch = () => {
    const newId = `KS${String(keySwitches.length + 1).padStart(3, '0')}`;
    const keySwitch = {
      ...newKeySwitch,
      id: newId,
      status: 'standby',
      isEnabled: false,
      lastToggled: new Date().toISOString(),
      toggledBy: 'John Mitchell',
      batteryLevel: 100,
      signalStrength: 5
    };
    
    setKeySwitches([...keySwitches, keySwitch]);
    setNewKeySwitch({
      name: '',
      description: '',
      location: '',
      category: 'access',
      priority: 'medium'
    });
    setShowAddModal(false);
    Alert.alert('Success', 'Key switch added successfully!');
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
    categorySelector: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
    },
    categoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      marginRight: 8,
    },
    selectedCategoryButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    categoryButtonText: {
      fontSize: 14,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    selectedCategoryButtonText: {
      color: 'white',
    },
    scrollContent: {
      padding: 20,
    },
    keySwitchCard: {
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
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
      marginRight: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 70,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: 'white',
      textTransform: 'capitalize',
    },
    cardMeta: {
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
    description: {
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftFooter: {
      flex: 1,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    locationText: {
      fontSize: 12,
      marginLeft: 4,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    lastToggled: {
      fontSize: 11,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    rightFooter: {
      alignItems: 'flex-end',
    },
    switchContainer: {
      marginBottom: 8,
    },
    statusIndicators: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    batteryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    batteryText: {
      fontSize: 11,
      marginLeft: 2,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    signalContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 14,
    },
    signalBar: {
      width: 2,
      marginRight: 1,
      borderRadius: 1,
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

  const formatLastToggled = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      return date.toLocaleDateString();
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
          <ThemedText style={styles.headerTitle}>Key Switch</ThemedText>
        </View>

        {/* Category Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categorySelector}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <ThemedText style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText
              ]}>
                {category}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {filteredKeySwitches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="toggle-outline" 
                size={60} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
              <ThemedText style={styles.emptyText}>
                No key switches found for this category
              </ThemedText>
            </View>
          ) : (
            filteredKeySwitches.map(keySwitch => (
              <View key={keySwitch.id} style={styles.keySwitchCard}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle}>{keySwitch.name}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(keySwitch.status) }]}>
                    <ThemedText style={styles.statusText}>{keySwitch.status}</ThemedText>
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name={getCategoryIcon(keySwitch.category)} 
                      size={14} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                    <ThemedText style={styles.metaText}>{keySwitch.category}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: getPriorityColor(keySwitch.priority) + '20',
                        borderWidth: 1,
                        borderColor: getPriorityColor(keySwitch.priority),
                        minWidth: 50
                      }
                    ]}>
                      <ThemedText style={[
                        styles.statusText,
                        { color: getPriorityColor(keySwitch.priority) }
                      ]}>
                        {keySwitch.priority}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <ThemedText style={styles.description}>{keySwitch.description}</ThemedText>

                <View style={styles.cardFooter}>
                  <View style={styles.leftFooter}>
                    <View style={styles.locationContainer}>
                      <Ionicons 
                        name="location-outline" 
                        size={14} 
                        color={Colors[colorScheme ?? 'light'].tabIconDefault}
                      />
                      <ThemedText style={styles.locationText}>{keySwitch.location}</ThemedText>
                    </View>
                    <ThemedText style={styles.lastToggled}>
                      Last toggled {formatLastToggled(keySwitch.lastToggled)} by {keySwitch.toggledBy}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.rightFooter}>
                    <View style={styles.switchContainer}>
                      <Switch
                        value={keySwitch.isEnabled}
                        onValueChange={(value) => handleToggleSwitch(keySwitch.id, value)}
                        trackColor={{ 
                          false: Colors[colorScheme ?? 'light'].border, 
                          true: Colors[colorScheme ?? 'light'].primary + '80' 
                        }}
                        thumbColor={keySwitch.isEnabled ? Colors[colorScheme ?? 'light'].primary : '#f4f3f4'}
                      />
                    </View>
                    
                    <View style={styles.statusIndicators}>
                      <View style={styles.batteryContainer}>
                        <Ionicons 
                          name={getBatteryIcon(keySwitch.batteryLevel)} 
                          size={12} 
                          color={keySwitch.batteryLevel > 25 ? '#10B981' : Colors[colorScheme ?? 'light'].primary}
                        />
                        <ThemedText style={styles.batteryText}>{keySwitch.batteryLevel}%</ThemedText>
                      </View>
                      
                      <View style={styles.signalContainer}>
                        {getSignalBars(keySwitch.signalStrength)}
                      </View>
                    </View>
                  </View>
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

        {/* Add Key Switch Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Add New Key Switch</ThemedText>
              
              <ScrollView>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={newKeySwitch.name}
                    onChangeText={(text) => setNewKeySwitch({...newKeySwitch, name: text})}
                    placeholder="Enter key switch name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Description</ThemedText>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newKeySwitch.description}
                    onChangeText={(text) => setNewKeySwitch({...newKeySwitch, description: text})}
                    placeholder="Enter description"
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Location</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={newKeySwitch.location}
                    onChangeText={(text) => setNewKeySwitch({...newKeySwitch, location: text})}
                    placeholder="Enter location"
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
                  onPress={handleAddKeySwitch}
                >
                  <ThemedText style={styles.modalButtonText}>Add Switch</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
