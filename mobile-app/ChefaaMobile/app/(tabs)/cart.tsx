import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { updateQuantity, removeFromCart, clearCart, applyCoupon } from '@/store/slices/cartSlice';

export default function CartScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const { items, totalItems, totalPrice, pharmacyDiscount, deliveryFee } = useSelector((state: RootState) => state.cart);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const finalTotal = totalPrice - pharmacyDiscount - deliveryFee;

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(id);
    } else {
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(removeFromCart(id)),
        },
      ]
    );
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      dispatch(applyCoupon({ code: couponCode, discount: 10 }));
      setAppliedCoupon(couponCode);
      setCouponCode('');
      Alert.alert('Success', 'Coupon applied successfully!');
    } else {
      Alert.alert('Invalid Coupon', 'Please check your coupon code and try again.');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items to your cart before checking out.');
      return;
    }
    navigation.navigate('(stacks)/checkout' as never);
  };

  const renderCartItem = (item: any) => (
    <View key={item.id} style={styles.cartItem}>
      <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        {item.prescription_required && (
          <View style={styles.prescriptionBadge}>
            <Text style={styles.prescriptionText}>Rx Required</Text>
          </View>
        )}
        <Text style={styles.itemPrice}>${item.price}</Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some products to get started with your health journey
        </Text>
        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={() => navigation.navigate('(tabs)/products' as never)}
        >
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity onPress={() => dispatch(clearCart())}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {items.map(renderCartItem)}
        
        {/* Coupon Section */}
        <View style={styles.couponContainer}>
          <Text style={styles.couponTitle}>Have a coupon?</Text>
          <View style={styles.couponInputContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity
              style={styles.applyCouponButton}
              onPress={handleApplyCoupon}
            >
              <Text style={styles.applyCouponText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {appliedCoupon && (
            <View style={styles.appliedCoupon}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.appliedCouponText}>{appliedCoupon} applied</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Order Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items ({totalItems})</Text>
          <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
        </View>
        
        {pharmacyDiscount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pharmacy Discount</Text>
            <Text style={styles.summaryValue}>-${pharmacyDiscount.toFixed(2)}</Text>
          </View>
        )}
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
            {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
          </Text>
        </View>
        
        {totalPrice > 25 && deliveryFee === 0 && (
          <Text style={styles.freeDeliveryText}>🎉 Free delivery applied!</Text>
        )}
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Continue Shopping */}
        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={() => navigation.navigate('(tabs)/products' as never)}
        >
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  clearAllText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Poppins-Medium',
  },
  itemsContainer: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  itemCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  prescriptionBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  prescriptionText: {
    fontSize: 10,
    color: '#92400E',
    fontFamily: 'Poppins-Medium',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  removeButton: {
    padding: 4,
  },
  couponContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  applyCouponButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  applyCouponText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  appliedCouponText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 6,
    fontFamily: 'Poppins-Medium',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 20,
  },
  summaryHeader: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Poppins-Medium',
  },
  freeText: {
    color: '#10B981',
  },
  freeDeliveryText: {
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Poppins-Medium',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Poppins-Bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  checkoutButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: 'Poppins-Bold',
  },
  continueShoppingButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueShoppingText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
});