import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchProductById } from '@/store/slices/productsSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentProduct } = useSelector((state: RootState) => state.products);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id as string));
    }
  }, [id, dispatch]);

  const handleAddToCart = () => {
    if (!currentProduct) return;
    
    dispatch(addToCart({
      product_id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      image_url: currentProduct.image_url,
      quantity,
      category: currentProduct.category_name,
      prescription_required: currentProduct.prescription_required,
      pharmacy_id: currentProduct.pharmacy_id,
    }));
    
    Alert.alert(
      'Added to Cart',
      `${quantity} ${currentProduct.name} added to your cart!`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
      ]
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/(stacks)/checkout');
  };

  const renderImageGallery = () => (
    <View style={styles.imageGallery}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setSelectedImage(newIndex);
        }}
      >
        {[currentProduct?.image_url, ...(currentProduct?.images || [])].map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      
      {/* Image Indicators */}
      <View style={styles.imageIndicators}>
        {[currentProduct?.image_url, ...(currentProduct?.images || [])].map((_, index) => (
          <View
            key={index}
            style={[
              styles.imageIndicator,
              selectedImage === index && styles.imageIndicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  if (!currentProduct) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{currentProduct.name}</Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => setIsFavorited(!isFavorited)}
            >
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorited ? '#EF4444' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.productBrand}>{currentProduct.brand}</Text>
          <Text style={styles.productCategory}>{currentProduct.category_name}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= currentProduct.rating ? '#F59E0B' : '#E5E7EB'}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {currentProduct.rating} ({currentProduct.review_count} reviews)
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>${currentProduct.price}</Text>
            {currentProduct.original_price && (
              <Text style={styles.originalPrice}>${currentProduct.original_price}</Text>
            )}
          </View>

          {/* Prescription Badge */}
          {currentProduct.prescription_required && (
            <View style={styles.prescriptionContainer}>
              <Ionicons name="medical" size={16} color="#EF4444" />
              <Text style={styles.prescriptionText}>Prescription Required</Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={16} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pharmacy Info */}
          {currentProduct.pharmacy_name && (
            <View style={styles.pharmacyContainer}>
              <Text style={styles.pharmacyTitle}>Available at</Text>
              <Text style={styles.pharmacyName}>{currentProduct.pharmacy_name}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <Text style={styles.productDescription}>{currentProduct.description}</Text>
            
            {currentProduct.active_ingredients && currentProduct.active_ingredients.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Active Ingredients:</Text>
                <Text style={styles.detailValue}>
                  {currentProduct.active_ingredients.join(', ')}
                </Text>
              </View>
            )}
            
            {currentProduct.dosage_form && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dosage Form:</Text>
                <Text style={styles.detailValue}>{currentProduct.dosage_form}</Text>
              </View>
            )}
            
            {currentProduct.strength && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Strength:</Text>
                <Text style={styles.detailValue}>{currentProduct.strength}</Text>
              </View>
            )}
          </View>

          {/* Warnings */}
          {currentProduct.warnings && currentProduct.warnings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Warnings</Text>
              {currentProduct.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Ionicons name="warning" size={14} color="#F59E0B" />
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Contraindications */}
          {currentProduct.contraindications && currentProduct.contraindications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contraindications</Text>
              {currentProduct.contraindications.map((contraindication, index) => (
                <View key={index} style={styles.contraindicationItem}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.contraindicationText}>{contraindication}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Added to Favorites', 'Product added to your favorites!')}
        >
          <Ionicons name="heart-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            style={styles.buyNowGradient}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGallery: {
    height: 300,
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width,
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  imageIndicatorActive: {
    backgroundColor: '#2563EB',
  },
  productInfo: {
    padding: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    fontFamily: 'Poppins-Bold',
  },
  favoriteButton: {
    padding: 4,
  },
  productBrand: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  productCategory: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  prescriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  prescriptionText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    fontFamily: 'Poppins-Medium',
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  quantityButton: {
    padding: 4,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  pharmacyContainer: {
    marginBottom: 20,
  },
  pharmacyTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  productDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  detailItem: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Poppins-Medium',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  contraindicationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contraindicationText: {
    fontSize: 14,
    color: '#7F1D1D',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  buyNowButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  buyNowGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
});