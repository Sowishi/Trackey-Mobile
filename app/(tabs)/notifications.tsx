import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, db, getDocs, query, where } from '../../firebase';

interface Notification {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  type: string;
  title: string;
  message: string;
  body?: string; // For announcements
  paymentId?: string;
  billId?: string;
  paymentProof?: string;
  status: 'read' | 'unread';
  createdAt: string;
  isAnnouncement?: boolean; // Flag to identify announcements
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Check if user is a collector/admin (not a resident)
  const isCollector = user?.position?.toLowerCase() !== 'resident' && 
                     user?.position?.toLowerCase() !== 'residents';

  const fetchNotifications = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      const allNotifications: Notification[] = [];

      // Fetch user-specific notifications or all notifications for collectors
      let notificationsQuery;
      
      if (isCollector) {
        notificationsQuery = query(collection(db, 'notifications'));
      } else {
        notificationsQuery = query(
          collection(db, 'notifications'),
          where('userEmail', '==', user.email)
        );
      }
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        allNotifications.push({
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          userName: data.userName || '',
          type: data.type || '',
          title: data.title || '',
          message: data.message || '',
          paymentId: data.paymentId,
          billId: data.billId,
          paymentProof: data.paymentProof,
          status: data.status || 'unread',
          createdAt: data.createdAt || new Date().toISOString(),
          isAnnouncement: false,
        } as Notification);
      });

      // Fetch announcements (visible to all users)
      const announcementsQuery = query(collection(db, 'announcements'));
      const announcementsSnapshot = await getDocs(announcementsQuery);
      
      announcementsSnapshot.forEach((doc) => {
        const data = doc.data();
        allNotifications.push({
          id: doc.id,
          type: 'announcement',
          title: data.title || 'Announcement',
          message: data.body || data.message || '',
          body: data.body,
          status: 'unread', // Announcements are always shown as new
          createdAt: data.createdAt || new Date().toISOString(),
          isAnnouncement: true,
        } as Notification);
      });

      // Sort by date (newest first)
      allNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, isCollector]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch {
      return dateString;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_submitted':
        return 'checkmark-circle';
      case 'payment_approved':
        return 'checkmark-done-circle';
      case 'payment_rejected':
        return 'close-circle';
      case 'bill_created':
        return 'document-text';
      case 'announcement':
        return 'megaphone';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_submitted':
        return Colors[colorScheme ?? 'light'].primary;
      case 'payment_approved':
        return '#059669';
      case 'payment_rejected':
        return '#DC2626';
      case 'bill_created':
        return '#3B82F6';
      case 'announcement':
        return '#F59E0B'; // Orange color for announcements
      default:
        return Colors[colorScheme ?? 'light'].primary;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View
      style={[
        styles.notificationCard,
        item.status === 'unread' && styles.unreadCard,
        item.isAnnouncement && styles.announcementCard,
      ]}
    >
      <View style={styles.notificationHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type) + '20' },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={20}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {item.isAnnouncement && '📢 '}
            {item.title}
          </Text>
          {isCollector && item.userName && !item.isAnnouncement && (
            <Text style={styles.userName}>{item.userName}</Text>
          )}
          <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        </View>
        {item.status === 'unread' && !item.isAnnouncement && (
          <View style={styles.unreadDot} />
        )}
      </View>

      <Text style={styles.notificationMessage}>
        {item.body || item.message}
      </Text>

      {item.paymentProof && (
        <TouchableOpacity
          style={styles.proofContainer}
          onPress={() => setSelectedImage(item.paymentProof!)}
        >
          <Image
            source={{ uri: item.paymentProof }}
            style={styles.proofThumbnail}
          />
          <View style={styles.proofOverlay}>
            <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
            <Text style={styles.proofText}>View Payment Proof</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    container: {
      padding: 16,
      paddingBottom: 102,
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 8,
      textAlign: 'center',
    },
    notificationCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    unreadCard: {
      borderLeftWidth: 3,
      borderLeftColor: Colors[colorScheme ?? 'light'].primary,
      backgroundColor: Colors[colorScheme ?? 'light'].accent,
    },
    announcementCard: {
      borderLeftWidth: 3,
      borderLeftColor: '#F59E0B',
      backgroundColor: '#FEF3C7',
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 2,
    },
    userName: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].primary,
      marginBottom: 2,
    },
    notificationTime: {
      fontSize: 11,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors[colorScheme ?? 'light'].primary,
      marginTop: 3,
    },
    notificationMessage: {
      fontSize: 13,
      color: Colors[colorScheme ?? 'light'].text,
      lineHeight: 18,
      marginTop: 6,
    },
    proofContainer: {
      marginTop: 8,
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative',
    },
    proofThumbnail: {
      width: '100%',
      height: 120,
      resizeMode: 'cover',
    },
    proofOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    proofText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 4,
    },
    imageModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageModalClose: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      padding: 10,
    },
    modalImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader
          title="Notifications"
          onUserPress={() => router.push('/(tabs)/profile')}
          profilePicUrl={user?.profilePicUrl}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Notifications"
        onUserPress={() => router.push('/(tabs)/profile')}
        profilePicUrl={user?.profilePicUrl}
      />
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-outline"
              size={80}
              color={Colors[colorScheme ?? 'light'].icon}
            />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              Your notifications will appear here
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors[colorScheme ?? 'light'].primary]}
          />
        }
      />

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          style={styles.imageModal}
          onPress={() => setSelectedImage(null)}
        >
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.modalImage} />
          )}
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
