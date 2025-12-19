import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchUserProfile, fetchFamilyMembers } from '@/store/slices/userSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { signOut } from '@/store/slices/authSlice';
import { fetchMedicalRecords, fetchPrescriptions } from '@/store/slices/medicalRecordsSlice';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile, familyMembers } = useSelector((state: RootState) => state.user);
  const { orders } = useSelector((state: RootState) => state.orders);
  const { notifications } = useSelector((state: RootState) => state.notifications);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserProfile());
      dispatch(fetchFamilyMembers());
      dispatch(fetchOrders());
      dispatch(fetchMedicalRecords());
      dispatch(fetchPrescriptions());
    }
  }, [user, dispatch]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => dispatch(signOut()),
        },
      ]
    );
  };

  const profileSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-circle',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          onPress: () => navigation.navigate('(stacks)/edit-profile' as never),
        },
        {
          icon: 'location',
          title: 'Addresses',
          subtitle: 'Manage your delivery addresses',
          onPress: () => navigation.navigate('(stacks)/addresses' as never),
        },
        {
          icon: 'card',
          title: 'Payment Methods',
          subtitle: 'Manage your payment options',
          onPress: () => navigation.navigate('(stacks)/payment-methods' as never),
        },
      ],
    },
    {
      title: 'Health',
      items: [
        {
          icon: 'document-text',
          title: 'Medical Records',
          subtitle: `${orders.length} records`,
          onPress: () => navigation.navigate('(stacks)/medical-records' as never),
        },
        {
          icon: 'medkit',
          title: 'Prescriptions',
          subtitle: 'View and manage prescriptions',
          onPress: () => navigation.navigate('(stacks)/prescriptions' as never),
        },
        {
          icon: 'people',
          title: 'Family Members',
          subtitle: `${familyMembers.length} members`,
          onPress: () => navigation.navigate('(stacks)/family-members' as never),
        },
        {
          icon: 'telescope',
          title: 'Telehealth',
          subtitle: 'Book consultations',
          onPress: () => navigation.navigate('(stacks)/telehealth' as never),
        },
      ],
    },
    {
      title: 'Orders',
      items: [
        {
          icon: 'receipt',
          title: 'Order History',
          subtitle: `${orders.length} orders`,
          onPress: () => navigation.navigate('(stacks)/order-history' as never),
        },
        {
          icon: 'location',
          title: 'Track Orders',
          subtitle: 'Track your current orders',
          onPress: () => navigation.navigate('(stacks)/track-orders' as never),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'call',
          title: 'Contact Support',
          subtitle: 'Get help and support',
          onPress: () => navigation.navigate('(stacks)/contact-support' as never),
        },
        {
          icon: 'help-circle',
          title: 'FAQ',
          subtitle: 'Frequently asked questions',
          onPress: () => navigation.navigate('(stacks)/faq' as never),
        },
        {
          icon: 'settings',
          title: 'Settings',
          subtitle: 'App preferences',
          onPress: () => navigation.navigate('(stacks)/settings' as never),
        },
      ],
    },
  ];

  const renderProfileSection = (section: any, index: number) => (
    <View key={index} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.items.map((item: any, itemIndex: number) => (
        <TouchableOpacity key={itemIndex} style={styles.menuItem} onPress={item.onPress}>
          <View style={styles.menuItemIcon}>
            <Ionicons name={item.icon as any} size={20} color="#2563EB" />
          </View>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile?.full_name || user?.user_metadata?.full_name || 'User Name'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userJoinDate}>Member since 2024</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{familyMembers.length}</Text>
          <Text style={styles.statLabel}>Family</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{notifications.unreadCount}</Text>
          <Text style={styles.statLabel}>Notifications</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {orders.slice(0, 2).map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.activityItem}
            onPress={() => navigation.navigate('(stacks)/order-detail' as never, { orderId: order.id } as never)}
          >
            <View style={[styles.activityIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="receipt" size={16} color="#2563EB" />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Order #{order.order_number}</Text>
              <Text style={styles.activitySubtitle}>{order.status}</Text>
            </View>
            <Text style={styles.activityAmount}>${order.total_amount}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="notifications" size={20} color="#6B7280" />
            <Text style={styles.preferenceText}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={notificationsEnabled ? '#2563EB' : '#FFFFFF'}
          />
        </View>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="finger-print" size={20} color="#6B7280" />
            <Text style={styles.preferenceText}>Biometric Login</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={biometricEnabled ? '#2563EB' : '#FFFFFF'}
          />
        </View>
      </View>

      {/* Menu Sections */}
      {profileSections.map(renderProfileSection)}

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  userJoinDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Poppins-SemiBold',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
    fontFamily: 'Poppins-Medium',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Poppins-SemiBold',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
});