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
}

export default function UsersScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

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

      // Sort by fullName alphabetically
      residentsList.sort((a, b) => a.fullName.localeCompare(b.fullName));

      setResidents(residentsList);
      setFilteredResidents(residentsList);
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

  // Filter residents based on search text
  useEffect(() => {
    let filtered = [...residents];

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (resident) =>
          resident.fullName.toLowerCase().includes(searchLower) ||
          resident.email.toLowerCase().includes(searchLower) ||
          resident.contactNumber?.toLowerCase().includes(searchLower) ||
          resident.meterNumber?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredResidents(filtered);
  }, [residents, searchText]);

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
          <Text style={styles.fullName}>{item.fullName}</Text>
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
      marginBottom: 12,
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
              placeholder="Search by name, email, contact, or meter..."
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

