import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchCategories, fetchFeaturedProducts } from '@/store/slices/productsSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';

const categories = [
  { id: '1', name: 'Medications', icon: 'medical', color: '#3B82F6' },
  { id: '2', name: 'Daily Essentials', icon: 'basket', color: '#10B981' },
  { id: '3', name: 'Personal Care', icon: 'heart', color: '#F59E0B' },
  { id: '4', name: 'Mother & Baby', icon: 'baby', color: '#EF4444' },
  { id: '5', name: 'Medical Supplies', icon: 'medkit', color: '#8B5CF6' },
  { id: '6', name: 'Skincare', icon: 'sparkles', color: '#EC4899' },
];

const featuredProducts = [
  {
    id: '1',
    name: 'Panadol Extra Strength',
    price: 15.99,
    image: 'https://via.placeholder.com/150',
    rating: 4.8,
    category: 'Medications',
  },
  {
    id: '2',
    name: 'CeraVe Moisturizing Lotion',
    price: 22.99,
    image: 'https://via.placeholder.com/150',
    rating: 4.9,
    category: 'Skincare',
  },
  {
    id: '3',
    name: 'Dove Beauty Bar',
    price: 8.99,
    image: 'https://via.placeholder.com/150',
    rating: 4.7,
    category: 'Personal Care',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { featuredProducts: products } = useSelector((state: RootState) => state.products);
  const { orders } = useSelector((state: RootState) => state.orders);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
    dispatch(fetchOrders());
  }, [dispatch]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchFeaturedProducts()),
      dispatch(fetchCategories()),
      dispatch(fetchOrders()),
    ]).finally(() => setRefreshing(false));
  }, [dispatch]);

  const handleCategoryPress = (category: any) => {
    navigation.navigate('products' as never);
  };

  const handleProductPress = (product: any) => {
    navigation.navigate('(stacks)/product-detail' as never, { id: product.id } as never);
  };

  const recentOrder = orders.find(order => order.status === 'shipped');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#2563EB', '#1D4ED8', '#1E40AF']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning! 👋</Text>
            <Text style={styles.subtitle}>How can we help your health today?</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for medications, products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => navigation.navigate('search' as never, { query: searchQuery } as never)}
          />
        </View>
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => navigation.navigate('(stacks)/prescription-upload' as never)}
        >
          <Ionicons name="camera" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Recent Order Status */}
      {recentOrder && (
        <TouchableOpacity style={styles.orderStatusCard}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.orderStatusGradient}>
            <View style={styles.orderStatusContent}>
              <View>
                <Text style={styles.orderStatusTitle}>Your order is on the way!</Text>
                <Text style={styles.orderStatusSubtitle}>
                  Tracking #{recentOrder.tracking_info?.tracking_number}
                </Text>
              </View>
              <Ionicons name="location" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('products' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={24} color={category.color} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('products' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => handleProductPress(product)}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <View style={styles.productRating}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.productRatingText}>{product.rating}</Text>
                </View>
                <Text style={styles.productPrice}>${product.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="document-text" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Upload Prescription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="telescope" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Book Consultation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="medkit" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Medical Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="location" size={24} color="#EF4444" />
            <Text style={styles.quickActionText}>Find Pharmacy</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  notificationButton: {
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  cameraButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderStatusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  orderStatusGradient: {
    padding: 16,
  },
  orderStatusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  orderStatusSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Poppins-Medium',
  },
  categoriesContainer: {
    paddingLeft: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#374151',
    fontFamily: 'Poppins-Medium',
  },
  productCard: {
    width: 140,
    marginRight: 16,
    marginLeft: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productRatingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#374151',
    marginTop: 8,
    fontFamily: 'Poppins-Medium',
  },
});