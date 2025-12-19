import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { searchProducts, clearSearchResults } from '@/store/slices/productsSlice';
import { addToCart } from '@/store/slices/cartSlice';

const recentSearches = [
  'Panadol',
  'CeraVe',
  'Dove',
  'Vitamin D',
  'Blood pressure monitor',
];

export default function SearchScreen() {
  const navigation = useNavigation();
  const localParams = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(recentSearches);
  
  const { searchResults, searchLoading } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    if (localParams.query) {
      setSearchQuery(localParams.query as string);
      handleSearch(localParams.query as string);
    }
  }, [localParams.query]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      dispatch(searchProducts({ query }));
      
      // Add to search history
      const updatedHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
      setSearchHistory(updatedHistory);
    }
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
  };

  const handleSearchItemPress = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    handleSearch(searchTerm);
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

  const clearSearch = () => {
    setSearchQuery('');
    dispatch(clearSearchResults());
  };

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
        <View style={styles.productPriceContainer}>
          <Text style={styles.productPrice}>${item.price}</Text>
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
        <Ionicons name="add" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for medications, products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Suggestions */}
      {!searchQuery && searchHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyContainer}>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleSearchItemPress(item)}
              >
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.historyText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            <Text style={styles.resultsCount}>{searchResults.length} items found</Text>
          </View>
          <FlatList
            data={searchResults}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.resultsList}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Search Loading */}
      {searchLoading && (
        <View style={styles.loadingContainer}>
          <Ionicons name="search" size={48} color="#2563EB" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* No Results */}
      {searchQuery && !searchLoading && searchResults.length === 0 && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={48} color="#D1D5DB" />
          <Text style={styles.noResultsText}>No products found</Text>
          <Text style={styles.noResultsSubtext}>
            Try searching with different keywords or check your spelling
          </Text>
          <TouchableOpacity
            style={styles.suggestionsButton}
            onPress={() => {
              const suggestions = ['medication', 'vitamins', 'personal care', 'medical supplies'];
              const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
              handleSearchItemPress(randomSuggestion);
            }}
          >
            <Text style={styles.suggestionsButtonText}>Try suggested searches</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Categories */}
      {!searchQuery && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Categories</Text>
          <View style={styles.categoriesGrid}>
            {[
              { name: 'Medications', icon: 'medical', color: '#3B82F6' },
              { name: 'Vitamins', icon: 'nutrition', color: '#10B981' },
              { name: 'Personal Care', icon: 'heart', color: '#F59E0B' },
              { name: 'Medical Devices', icon: 'hardware-chip', color: '#8B5CF6' },
            ].map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => handleSearchItemPress(category.name)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
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
  historyContainer: {
    paddingLeft: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  resultsList: {
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
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 16,
  },
  productBrand: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  productPriceContainer: {
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  prescriptionBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  prescriptionText: {
    fontSize: 9,
    color: '#92400E',
    fontFamily: 'Poppins-Medium',
  },
  addToCartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontFamily: 'Poppins-Regular',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  suggestionsButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 24,
  },
  suggestionsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
  },
});