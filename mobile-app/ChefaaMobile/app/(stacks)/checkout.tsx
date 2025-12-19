import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { createOrder, clearCart } from '@/store/slices/ordersSlice';
import { LinearGradient } from 'expo-linear-gradient';

export default function CheckoutScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { items, totalItems, totalPrice, pharmacyDiscount, deliveryFee } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'wallet'>('card');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotal = totalPrice - pharmacyDiscount - deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state) {
      Alert.alert('Incomplete Address', 'Please fill in all required address fields.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          pharmacy_id: item.pharmacy_id,
          pharmacy_name: item.pharmacy_name,
        })),
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      
      // Clear cart after successful order
      dispatch(clearCart());
      
      Alert.alert(
        'Order Placed!',
        `Your order #${result.order_number} has been placed successfully.`,
        [
          {
            text: 'Track Order',
            onPress: () => router.push('/(stacks)/order-tracking'),
          },
          {
            text: 'Back to Home',
            onPress: () => router.push('/(tabs)/home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Order Failed', 'There was an error placing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'card',
      title: 'Credit/Debit Card',
      subtitle: 'Visa, Mastercard, American Express',
      icon: 'card',
      available: true,
    },
    {
      id: 'cash',
      title: 'Cash on Delivery',
      subtitle: 'Pay when your order arrives',
      icon: 'cash',
      available: true,
    },
    {
      id: 'wallet',
      title: 'Digital Wallet',
      subtitle: 'Apple Pay, Google Pay',
      icon: 'wallet',
      available: false,
    },
  ];

  const renderPaymentMethod = (method: any) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethod,
        paymentMethod === method.id && styles.paymentMethodSelected,
        !method.available && styles.paymentMethodDisabled,
      ]}
      onPress={() => method.available && setPaymentMethod(method.id as any)}
      disabled={!method.available}
    >
      <View style={styles.paymentMethodInfo}>
        <Ionicons
          name={method.icon as any}
          size={24}
          color={paymentMethod === method.id ? '#2563EB' : method.available ? '#6B7280' : '#D1D5DB'}
        />
        <View style={styles.paymentMethodText}>
          <Text style={[
            styles.paymentMethodTitle,
            paymentMethod === method.id && styles.paymentMethodTitleSelected,
            !method.available && styles.paymentMethodTitleDisabled,
          ]}>
            {method.title}
          </Text>
          <Text style={[
            styles.paymentMethodSubtitle,
            !method.available && styles.paymentMethodSubtitleDisabled,
          ]}>
            {method.subtitle}
          </Text>
        </View>
      </View>
      {paymentMethod === method.id && (
        <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressContainer}>
            <TextInput
              style={styles.input}
              placeholder="Street Address *"
              value={deliveryAddress.street}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, street: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="City *"
              value={deliveryAddress.city}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, city: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="State *"
              value={deliveryAddress.state}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, state: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              value={deliveryAddress.postal_code}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, postal_code: text }))}
            />
            <TouchableOpacity style={styles.savedAddressesButton}>
              <Ionicons name="location" size={16} color="#2563EB" />
              <Text style={styles.savedAddressesText}>Use Saved Addresses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemDetails}>
                  Qty: {item.quantity} × ${item.price}
                </Text>
              </View>
              <Text style={styles.orderItemTotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special delivery instructions..."
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryContainer}>
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
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.totalDisplay}>
          <Text style={styles.totalDisplayLabel}>Total</Text>
          <Text style={styles.totalDisplayValue}>${finalTotal.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.placeOrderButton, isProcessing && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={isProcessing ? ['#9CA3AF', '#6B7280'] : ['#2563EB', '#1D4ED8']}
            style={styles.placeOrderGradient}
          >
            <Text style={styles.placeOrderText}>
              {isProcessing ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  addressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    height: 80,
  },
  savedAddressesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  savedAddressesText: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 6,
    fontFamily: 'Poppins-Medium',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  orderItemDetails: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  paymentMethodDisabled: {
    opacity: 0.5,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
  },
  paymentMethodTitleSelected: {
    color: '#2563EB',
  },
  paymentMethodTitleDisabled: {
    color: '#D1D5DB',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  paymentMethodSubtitleDisabled: {
    color: '#D1D5DB',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    gap: 16,
  },
  totalDisplay: {
    flex: 1,
  },
  totalDisplayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  totalDisplayValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  placeOrderButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeOrderButtonDisabled: {
    opacity: 0.7,
  },
  placeOrderGradient: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    fontFamily: 'Poppins-Bold',
  },
});