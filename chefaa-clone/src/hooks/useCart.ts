import { useState, useEffect, useCallback } from 'react';

export type CartItem = {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  quantity: number;
  image: string;
};

const CART_STORAGE_KEY = 'chefaa_cart';

// Load cart from localStorage
function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return [];
  }
}

// Save cart to localStorage
function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart on mount
  useEffect(() => {
    const items = loadCartFromStorage();
    setCartItems(items);
    setIsLoaded(true);
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveCartToStorage(cartItems);
    }
  }, [cartItems, isLoaded]);

  const addToCart = useCallback((product: { 
    id: string; 
    name: string; 
    name_ar: string; 
    price: number; 
    images: string[] 
  }) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        name_ar: product.name_ar,
        price: product.price,
        quantity: 1,
        image: product.images[0] || '',
      }];
    });
  }, []);

  const updateCartQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev => prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  return {
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    isLoaded,
  };
}
