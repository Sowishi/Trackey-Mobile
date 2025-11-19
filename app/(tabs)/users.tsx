import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, getDocs, query, where } from '../../firebase';

interface Resident {
  id: string;
  age?: number;
  accountNumber?: string;
  contactNumber?: string;
  createdAt?: string;
  email: string;
  fullName: string;
  gender?: string;
  isArchived: boolean;
  meterNumber?: string;
  password?: string;
  passwordChanged?: boolean;
  paymentStatus?: string;
  profilePicUrl?: string;
  role: string;
  status: string;
  hasUnpaidBills?: boolean;
  hasPaidBills?: boolean;
  hasBilling?: boolean;
}

type FilterType = 'all' | 'paid' | 'unpaid' | 'meter-read' | 'no-billing';

export default function UsersScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const fetchResidents = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'resident'),
        where('isArchived', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const residentsList: Resident[] = [];

      querySnapshot.forEach((doc) => {
        residentsList.push({
          id: doc.id,
          ...doc.data(),
        } as Resident);
      });

      // Fetch billing status for each resident
      const billingRef = collection(db, 'billing');
      const residentsWithStatus = await Promise.all(
        residentsList.map(async (resident) => {
          try {
            // Check for any billing
            const allBillsQuery = query(
              billingRef,
              where('userId', '==', resident.id)
            );
            const allBillsSnapshot = await getDocs(allBillsQuery);
            const hasBilling = !allBillsSnapshot.empty;

            // Check for unpaid bills
            const unpaidBillQuery = query(
              billingRef,
              where('userId', '==', resident.id),
              where('status', '==', 'unpaid')
            );
            const unpaidBillSnapshot = await getDocs(unpaidBillQuery);
            const hasUnpaidBills = !unpaidBillSnapshot.empty;

            // Check for paid bills
            const paidBillQuery = query(
              billingRef,
              where('userId', '==', resident.id),
              where('status', '==', 'paid')
            );
            const paidBillSnapshot = await getDocs(paidBillQuery);
            const hasPaidBills = !paidBillSnapshot.empty;

            return {
              ...resident,
              hasUnpaidBills,
              hasPaidBills,
              hasBilling,
            };
          } catch (error) {
            console.error(`Error fetching bills for ${resident.fullName}:`, error);
            return {
              ...resident,
              hasUnpaidBills: false,
              hasPaidBills: false,
              hasBilling: false,
            };
          }
        })
      );

      // Sort by fullName alphabetically
      residentsWithStatus.sort((a, b) => a.fullName.localeCompare(b.fullName));

      setResidents(residentsWithStatus);
      setFilteredResidents(residentsWithStatus);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  // Filter residents based on search text and filter selection
  useEffect(() => {
    let filtered = [...residents];

    // Filter by selected filter type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((resident) => {
        switch (selectedFilter) {
          case 'paid':
            return resident.hasPaidBills && !resident.hasUnpaidBills;
          case 'unpaid':
            return resident.hasUnpaidBills;
          case 'meter-read':
            return resident.hasBilling;
          case 'no-billing':
            return !resident.hasBilling;
          default:
            return true;
        }
      });
    }

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (resident) =>
          resident.fullName.toLowerCase().includes(searchLower) ||
          resident.accountNumber?.toLowerCase().includes(searchLower) ||
          resident.email.toLowerCase().includes(searchLower) ||
          resident.contactNumber?.toLowerCase().includes(searchLower) ||
          resident.meterNumber?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredResidents(filtered);
  }, [residents, searchText, selectedFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResidents();
  };

  const handleUserPress = (resident: Resident) => {
    console.log(resident.id);
    router.push({
      pathname: '/(tabs)/user-detail',
      params: {
        userId: resident.id,
      },
    });
  };

  const filters: { type: FilterType; label: string; icon: string }[] = [
    { type: 'all', label: 'All', icon: 'apps' },
    { type: 'paid', label: 'Paid', icon: 'checkmark-circle' },
    { type: 'unpaid', label: 'Unpaid', icon: 'alert-circle' },
    { type: 'meter-read', label: 'Meter Read', icon: 'speedometer' },
    { type: 'no-billing', label: 'No Billing', icon: 'document-text-outline' },
  ];

  const renderFilterBadge = (filter: { type: FilterType; label: string; icon: string }) => {
    const isSelected = selectedFilter === filter.type;
    return (
      <TouchableOpacity
        key={filter.type}
        style={[
          styles.filterBadge,
          isSelected && styles.filterBadgeSelected,
        ]}
        onPress={() => setSelectedFilter(filter.type)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={filter.icon as any}
          size={16}
          color={isSelected ? '#FFFFFF' : Colors[colorScheme ?? 'light'].text}
          style={styles.filterIcon}
        />
        <Text
          style={[
            styles.filterBadgeText,
            isSelected && styles.filterBadgeTextSelected,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderResidentCard = ({ item }: { item: Resident }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {item.profilePicUrl ? (
          <Image
            source={{ uri: item.profilePicUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={24}
              color={Colors[colorScheme ?? 'light'].primary}
            />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.fullName}>{item.accountNumber || item.fullName}</Text>
          <View style={styles.badgeContainer}>
            {/* Payment Status Badge */}
            {item.hasBilling && (
              <View style={[
                styles.paymentBadge,
                item.hasUnpaidBills ? styles.unpaidBadge : styles.paidBadge
              ]}>
                <Text style={styles.badgeText}>
                  {item.hasUnpaidBills ? 'Unpaid' : 'Paid'}
                </Text>
              </View>
            )}
            
            {/* Meter Read Badge */}
            <View style={[
              styles.meterBadge,
              item.hasBilling ? styles.meterReadBadge : styles.meterNotReadBadge
            ]}>
              <Ionicons
                name={item.hasBilling ? 'speedometer' : 'speedometer-outline'}
                size={10}
                color={Colors[colorScheme ?? 'light'].text}
                style={styles.meterIcon}
              />
              <Text style={styles.meterBadgeText}>
                {item.hasBilling ? 'Meter Read' : 'Not Read'}
              </Text>
            </View>

            {/* No Billing Badge */}
            {!item.hasBilling && (
              <View style={styles.noBillingBadge}>
                <Ionicons
                  name="document-text-outline"
                  size={10}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={styles.meterIcon}
                />
                <Text style={styles.noBillingBadgeText}>
                  No Billing
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors[colorScheme ?? 'light'].icon}
        />
      </View>
      
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      flex: 1,
      paddingBottom: 80,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginBottom: 8,
    },
    filterContainer: {
      paddingBottom: 8,
    },
    filterScrollView: {
      flexDirection: 'row',
      gap: 8,
    },
    filterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      marginRight: 8,
    },
    filterBadgeSelected: {
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      borderColor: Colors[colorScheme ?? 'light'].primary,
    },
    filterIcon: {
      marginRight: 6,
    },
    filterBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    filterBadgeTextSelected: {
      color: '#FFFFFF',
    },
    monthLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      borderRadius: 8,
      marginTop: 8,
      marginBottom: 4,
    },
    monthIcon: {
      marginRight: 6,
    },
    monthLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].primary,
    },
    noteContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginTop: 4,
      marginBottom: 8,
    },
    noteIcon: {
      marginRight: 6,
    },
    noteText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      fontStyle: 'italic',
      flex: 1,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    content: {
      padding: 16,
      paddingTop: 0,
      paddingBottom: 20,
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
      textAlign: 'center',
    },
    card: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 12,
      padding: 10,
      marginBottom: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardInfo: {
      flex: 1,
    },
    fullName: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      opacity: 0.6,
    },
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    cardDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    detailText: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      marginLeft: 6,
      opacity: 0.7,
    },
    paymentBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    paidBadge: {
      backgroundColor: '#D1FAE5',
    },
    unpaidBadge: {
      backgroundColor: '#FEE2E2',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    meterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    meterReadBadge: {
      backgroundColor: '#E0F2FE',
    },
    meterNotReadBadge: {
      backgroundColor: '#FEF3C7',
    },
    meterIcon: {
      marginRight: 3,
    },
    meterBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    noBillingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: 'flex-start',
      backgroundColor: '#FFE4E6',
    },
    noBillingBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
        title="List of Users" 
        onUserPress={() => router.push('/(tabs)/profile')}
        profilePicUrl={user?.profilePicUrl}
      />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading residents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader 
        title="List of Users" 
        onUserPress={() => router.push('/(tabs)/profile')}
        profilePicUrl={user?.profilePicUrl}
      />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color={Colors[colorScheme ?? 'light'].icon}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors[colorScheme ?? 'light'].icon}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Badges */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollView}
            >
              {filters.map(renderFilterBadge)}
            </ScrollView>
          </View>

          {/* Current Month Label */}
          <View style={styles.monthLabelContainer}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors[colorScheme ?? 'light'].primary}
              style={styles.monthIcon}
            />
            <Text style={styles.monthLabel}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={Colors[colorScheme ?? 'light'].tabIconDefault}
              style={styles.noteIcon}
            />
            <Text style={styles.noteText}>
              Note: Next month will reset and turn paid to unpaid
            </Text>
          </View>
        </View>

        {/* Residents List */}
        {filteredResidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={80}
              color={Colors[colorScheme ?? 'light'].icon}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {residents.length === 0
                ? 'No residents found'
                : 'No matching residents found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {residents.length === 0
                ? 'There are no active residents in the system'
                : 'Try adjusting your search or filter'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredResidents}
            renderItem={renderResidentCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors[colorScheme ?? 'light'].primary]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

