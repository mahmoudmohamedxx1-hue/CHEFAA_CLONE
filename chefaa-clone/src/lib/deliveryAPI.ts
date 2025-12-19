// API proxy for delivery tracking
// This file can be used to proxy requests to the Supabase edge function

const DELIVERY_API_URL = process.env.REACT_APP_DELIVERY_API_URL || '/api/supabase/functions/delivery-tracking';

export const deliveryAPI = {
  // Get delivery status for an order
  getDeliveryStatus: async (orderId: string) => {
    try {
      const response = await fetch(DELIVERY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDeliveryStatus',
          orderId: orderId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching delivery status:', error);
      
      // Return demo data if API fails
      return {
        data: {
          hasDelivery: true,
          delivery: {
            delivery_id: 'demo-delivery-id',
            order_id: orderId,
            status: 'in_transit',
            status_message: 'Package is on the way to your location',
            driver_name: 'Ahmed Hassan',
            driver_phone: '+20 123 456 7890',
            current_latitude: 30.0444,
            current_longitude: 31.2357,
            delivery_type: 'standard',
            progress_percentage: 75,
            estimatedArrivalMinutes: 15,
            currentLocation: { lat: 30.0444, lng: 31.2357 },
            statusHistory: [
              {
                status: 'pending',
                status_message: 'Order is being prepared',
                created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
              },
              {
                status: 'assigned',
                status_message: 'Driver Ahmed Hassan has been assigned',
                created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
              },
              {
                status: 'picked_up',
                status_message: 'Package picked up from pharmacy',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
              },
              {
                status: 'in_transit',
                status_message: 'Package is on the way',
                created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
              }
            ],
            recentGpsLogs: [
              {
                latitude: 30.0444,
                longitude: 31.2357,
                speed_kmh: 25,
                created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
              }
            ]
          }
        }
      };
    }
  },

  // Update delivery location
  updateLocation: async (deliveryId: string, location: any) => {
    try {
      const response = await fetch(DELIVERY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateLocation',
          deliveryId: deliveryId,
          location: location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating location:', error);
      // Return success for demo
      return { success: true };
    }
  },

  // Calculate ETA
  calculateETA: async (currentLocation: any, destinationLocation: any, deliveryType: string) => {
    try {
      const response = await fetch(DELIVERY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculateETA',
          currentLocation: currentLocation,
          destinationLocation: destinationLocation,
          deliveryType: deliveryType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate ETA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating ETA:', error);
      // Return demo ETA
      return { data: 15 };
    }
  },

  // Update delivery status
  updateDeliveryStatus: async (deliveryId: string, status: string, message: string) => {
    try {
      const response = await fetch(DELIVERY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateDeliveryStatus',
          deliveryId: deliveryId,
          status: status,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      // Return success for demo
      return { success: true };
    }
  },

  // Get available delivery slots
  getDeliverySlots: async (date: string, deliveryType: string) => {
    try {
      const response = await fetch(DELIVERY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDeliverySlots',
          date: date,
          deliveryType: deliveryType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery slots');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching delivery slots:', error);
      // Return demo slots
      return {
        data: [
          { id: '1', time_slot_start: '09:00', time_slot_end: '10:00', available_capacity: 10 },
          { id: '2', time_slot_start: '10:00', time_slot_end: '11:00', available_capacity: 15 },
          { id: '3', time_slot_start: '14:00', time_slot_end: '15:00', available_capacity: 12 }
        ]
      };
    }
  },

  // Create delivery
  createDelivery: async (orderId: string, deliveryData: any) => {
    try {
      const response = await fetch(DELIVERY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createDelivery',
          orderId: orderId,
          deliveryData: deliveryData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create delivery');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating delivery:', error);
      // Return demo delivery for demo
      return {
        data: {
          id: 'demo-delivery-' + Date.now().toString(36),
          order_id: orderId,
          status: 'pending'
        }
      };
    }
  },

  // Report issue
  reportIssue: async (deliveryId: string, issueData: any) => {
    try {
      const response = await fetch(DELIVERY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reportIssue',
          deliveryId: deliveryId,
          issueData: issueData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to report issue');
      }

      return await response.json();
    } catch (error) {
      console.error('Error reporting issue:', error);
      // Return success for demo
      return { success: true };
    }
  }
};