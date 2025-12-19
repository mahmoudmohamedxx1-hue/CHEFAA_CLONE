import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchProducts, fetchCategories, setCategory, searchProducts } from '@/store/slices/productsSlice';
import { addToCart } from '@/store/slices/cartSlice';

export default function ProductsScreen() {
  const navigation = useNavigation();
  const localParams = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  
  const { products, categories, isLoading, filters } = useSelector((state: RootState) => state.products);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price_low' | 'price_high' | 'rating' | 'newest'>('newest');

  useEffect(() => {
    dispatch(fetchCategories());
    if (localParams.category) {
      dispatch(setCategory(localParams.category as string));
    }
    dispatch(fetchProducts({ page: 1, category: localParams.category as string }));
  }, [dispatch, localParams.category]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    dispatch(fetchProducts({ page: 1, category: filters.category }))
      .finally(() => setRefreshing(false));
  }, [dispatch, filters.category]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      dispatch(searchProducts({ query: searchQuery, filters }));
    }
  };

  const handleProductPress = (product: any) => {
    navigation.navigate('(stacks)/product-detail' as never, { id: product.id } as never);
  };

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
      category: product.category_name,
      prescription_required: product.prescription_required,
      pharmacy_id: product.pharmacy_id,
    }));
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        filters.category === item.id && styles.categoryChipActive
      ]}
      onPress={() => {
        dispatch(setCategory(item.id));
        dispatch(fetchProducts({ page: 1, category: item.id }));
      }}
    >
      <Text style={[
        styles.categoryChipText,
        filters.category === item.id && styles.categoryChipTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.image_url }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <View style={styles.productRating}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.productRatingText}>{item.rating}</Text>
          <Text style={styles.reviewCount}>({item.review_count})</Text>
        </View>
        <View style={styles.productPriceContainer}>
          <Text style={styles.productPrice}>${item.price}</Text>
          {item.original_price && (
            <Text style={styles.originalPrice}>${item.original_price}</Text>
          )}
        </View>
        {item.prescription_required && (
          <View style={styles.prescriptionBadge}>
            <Text style={styles.prescriptionText}>Rx Required</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => handleAddToCart(item)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="filter" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              style={styles.categoriesList}
              contentContainerStyle={styles.categoriesContent}
            />
          </ScrollView>
          
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortOptions}>
              {['newest', 'price_low', 'price_high', 'rating'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortOption,
                    sortBy === option && styles.sortOptionActive
                  ]}
                  onPress={() => setSortBy(option as any)}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === option && styles.sortOptionTextActive
                  ]}>
                    {option.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Products Grid */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          // Load more products if needed
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
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
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 12,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoriesContent: {
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins-Medium',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  sortOptionActive: {
    backgroundColor: '#2563EB',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Poppins-Medium',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },
  productsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
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
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
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
    marginRight: 8,
    fontFamily: 'Poppins-Regular',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins-Regular',
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  prescriptionBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  prescriptionText: {
    fontSize: 10,
    color: '#92400E',
    fontFamily: 'Poppins-Medium',
  },
  addToCartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
});