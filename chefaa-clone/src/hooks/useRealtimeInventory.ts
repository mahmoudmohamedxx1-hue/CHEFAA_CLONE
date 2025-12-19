import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface InventoryUpdate {
  product_id: string;
  stock_quantity: number;
  previous_quantity?: number;
  timestamp: string;
}

export function useRealtimeInventory(productIds?: string[]) {
  const [inventoryUpdates, setInventoryUpdates] = useState<Map<string, number>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let channel: RealtimeChannel;

    const subscribeToInventory = async () => {
      // Subscribe to products table changes
      channel = supabase
        .channel('inventory-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'products',
            filter: productIds ? `id=in.(${productIds.join(',')})` : undefined,
          },
          (payload) => {
            console.log('[Realtime] Inventory update:', payload);
            
            if (payload.new && 'id' in payload.new && 'stock_quantity' in payload.new) {
              const { id, stock_quantity } = payload.new as { id: string; stock_quantity: number };
              
              setInventoryUpdates((prev) => {
                const updated = new Map(prev);
                updated.set(id, stock_quantity);
                return updated;
              });

              // Show toast notification for low stock
              if (stock_quantity < 10 && stock_quantity > 0) {
                console.warn(`Low stock alert for product ${id}: ${stock_quantity} remaining`);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    subscribeToInventory();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [productIds?.join(',')]);

  return {
    inventoryUpdates,
    isConnected,
    getStockQuantity: (productId: string) => inventoryUpdates.get(productId),
  };
}

// Hook for single product inventory
export function useProductInventory(productId: string) {
  const { inventoryUpdates, isConnected, getStockQuantity } = useRealtimeInventory([productId]);
  
  return {
    stockQuantity: getStockQuantity(productId),
    isConnected,
  };
}
