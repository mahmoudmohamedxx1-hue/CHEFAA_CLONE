// Real-time GPS Delivery Tracking API
// Handles GPS tracking data, delivery status updates, and ETA calculation

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const { action, ...data } = await req.json();

    let result;

    switch (action) {
      case 'getDeliveryStatus':
        result = await getDeliveryStatus(data.orderId, supabaseUrl, supabaseKey);
        break;
      
      case 'updateLocation':
        result = await updateLocation(data.deliveryId, data.location, supabaseUrl, supabaseKey);
        break;
      
      case 'calculateETA':
        result = await calculateETA(data.currentLocation, data.destinationLocation, data.deliveryType, supabaseUrl, supabaseKey);
        break;
      
      case 'updateDeliveryStatus':
        result = await updateDeliveryStatus(data.deliveryId, data.status, data.message, supabaseUrl, supabaseKey);
        break;
      
      case 'getDeliverySlots':
        result = await getDeliverySlots(data.date, data.deliveryType, supabaseUrl, supabaseKey);
        break;
      
      case 'createDelivery':
        result = await createDelivery(data.orderId, data.deliveryData, supabaseUrl, supabaseKey);
        break;
      
      case 'simulateDeliveryRoute':
        result = await simulateDeliveryRoute(data.deliveryId, supabaseUrl, supabaseKey);
        break;
      
      case 'reportIssue':
        result = await reportIssue(data.deliveryId, data.issueData, supabaseUrl, supabaseKey);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delivery tracking error:', error);
    return new Response(JSON.stringify({ 
      error: { 
        code: 'DELIVERY_TRACKING_ERROR', 
        message: error.message 
      } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Get delivery status for an order
async function getDeliveryStatus(orderId: string, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/delivery_tracking?order_id=eq.${orderId}&select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch delivery status');
  }

  const deliveries = await response.json();
  
  if (deliveries.length === 0) {
    return { hasDelivery: false };
  }

  const delivery = deliveries[0];

  // Get status history
  const historyResponse = await fetch(
    `${supabaseUrl}/rest/v1/delivery_status_history?delivery_id=eq.${delivery.id}&order=created_at.desc&limit=10`, 
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  const statusHistory = await historyResponse.json();

  // Get recent GPS logs
  const gpsResponse = await fetch(
    `${supabaseUrl}/rest/v1/delivery_gps_logs?delivery_id=eq.${delivery.id}&order=created_at.desc&limit=5`, 
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  const gpsLogs = await gpsResponse.json();

  // Calculate progress percentage
  const progressPercentage = getProgressPercentage(delivery.status);

  // Calculate ETA if we have location data
  let estimatedTime = null;
  if (delivery.current_latitude && delivery.current_longitude && delivery.delivery_address?.coordinates) {
    const currentLocation = {
      lat: parseFloat(delivery.current_latitude),
      lng: parseFloat(delivery.current_longitude)
    };
    const destinationLocation = delivery.delivery_address.coordinates;
    
    estimatedTime = await calculateETA(currentLocation, destinationLocation, delivery.delivery_type, supabaseUrl, supabaseKey);
  }

  return {
    hasDelivery: true,
    delivery: {
      ...delivery,
      progressPercentage,
      estimatedArrivalMinutes: estimatedTime,
      statusHistory,
      recentGpsLogs: gpsLogs,
      currentLocation: delivery.current_latitude && delivery.current_longitude ? {
        lat: parseFloat(delivery.current_latitude),
        lng: parseFloat(delivery.current_longitude)
      } : null
    }
  };
}

// Update delivery location with GPS coordinates
async function updateLocation(deliveryId: string, location: any, supabaseUrl: string, supabaseKey: string) {
  const { lat, lng, accuracy, speed, heading } = location;

  // Update main delivery tracking record
  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/delivery_tracking?id=eq.${deliveryId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      current_latitude: lat,
      current_longitude: lng,
      updated_at: new Date().toISOString()
    })
  });

  if (!updateResponse.ok) {
    throw new Error('Failed to update delivery location');
  }

  // Log GPS coordinates
  const gpsLogResponse = await fetch(`${supabaseUrl}/rest/v1/delivery_gps_logs`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      delivery_id: deliveryId,
      latitude: lat,
      longitude: lng,
      accuracy: accuracy,
      speed_kmh: speed,
      heading_degrees: heading
    })
  });

  if (!gpsLogResponse.ok) {
    throw new Error('Failed to log GPS coordinates');
  }

  return { success: true, location: { lat, lng } };
}

// Calculate ETA using database function
async function calculateETA(currentLocation: any, destinationLocation: any, deliveryType: string, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/calculate_eta`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_current_lat: currentLocation.lat,
      p_current_lng: currentLocation.lng,
      p_destination_lat: destinationLocation.lat,
      p_destination_lng: destinationLocation.lng,
      p_delivery_type: deliveryType
    })
  });

  if (!response.ok) {
    throw new Error('Failed to calculate ETA');
  }

  const etaMinutes = await response.json();
  return etaMinutes;
}

// Update delivery status
async function updateDeliveryStatus(deliveryId: string, status: string, message: string, supabaseUrl: string, supabaseKey: string) {
  // Update main delivery tracking record
  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/delivery_tracking?id=eq.${deliveryId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status,
      status_message: message,
      updated_at: new Date().toISOString()
    })
  });

  if (!updateResponse.ok) {
    throw new Error('Failed to update delivery status');
  }

  // Add to status history
  const historyResponse = await fetch(`${supabaseUrl}/rest/v1/delivery_status_history`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      delivery_id: deliveryId,
      status,
      status_message: message,
      location_description: getStatusMessage(status)
    })
  });

  if (!historyResponse.ok) {
    throw new Error('Failed to add status history');
  }

  return { success: true, status, message };
}

// Get available delivery slots
async function getDeliverySlots(date: string, deliveryType: string, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/delivery_slots?date=eq.${date}&delivery_type=eq.${deliveryType}&available=eq.true&order=time_slot_start.asc`, 
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch delivery slots');
  }

  return await response.json();
}

// Create a new delivery tracking record
async function createDelivery(orderId: string, deliveryData: any, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/delivery_tracking`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_id: orderId,
      delivery_type: deliveryData.deliveryType,
      delivery_address: deliveryData.deliveryAddress,
      pickup_address: deliveryData.pickupAddress,
      status: 'pending',
      customer_phone: deliveryData.customerPhone,
      customer_email: deliveryData.customerEmail,
      special_instructions: deliveryData.specialInstructions,
      delivery_fee: deliveryData.deliveryFee
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create delivery tracking record');
  }

  const delivery = await response.json();
  return delivery[0];
}

// Simulate delivery route for testing/demo purposes
async function simulateDeliveryRoute(deliveryId: string, supabaseUrl: string, supabaseKey: string) {
  // Get delivery details
  const deliveryResponse = await fetch(`${supabaseUrl}/rest/v1/delivery_tracking?id=eq.${deliveryId}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  if (!deliveryResponse.ok) {
    throw new Error('Failed to fetch delivery');
  }

  const deliveries = await deliveryResponse.json();
  if (deliveries.length === 0) {
    throw new Error('Delivery not found');
  }

  const delivery = deliveries[0];
  
  // Define simulation route from a pharmacy in Cairo to the delivery address
  const startLat = 30.0444; // Downtown Cairo (example pharmacy location)
  const startLng = 31.2357;
  
  if (!delivery.delivery_address?.coordinates) {
    throw new Error('No destination coordinates available');
  }

  const endLat = delivery.delivery_address.coordinates.lat;
  const endLng = delivery.delivery_address.coordinates.lng;

  // Simulate the route with waypoints
  const routePoints = generateSimulationRoute(startLat, startLng, endLat, endLng, 30); // 30 points

  return {
    route: routePoints,
    totalDistance: calculateRouteDistance(routePoints),
    estimatedDuration: routePoints.length * 2 // 2 minutes per point
  };
}

// Report a delivery issue
async function reportIssue(deliveryId: string, issueData: any, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/delivery_issues`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      delivery_id: deliveryId,
      issue_type: issueData.type,
      severity: issueData.severity || 'medium',
      description: issueData.description
    })
  });

  if (!response.ok) {
    throw new Error('Failed to report issue');
  }

  return { success: true };
}

// Helper functions
function getProgressPercentage(status: string): number {
  switch (status) {
    case 'pending': return 10;
    case 'assigned': return 25;
    case 'picked_up': return 50;
    case 'in_transit': return 75;
    case 'out_for_delivery': return 85;
    case 'delivered': return 100;
    default: return 0;
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending': return 'Delivery is being prepared';
    case 'assigned': return 'Driver has been assigned';
    case 'picked_up': return 'Package picked up from pharmacy';
    case 'in_transit': return 'Package is on the way';
    case 'out_for_delivery': return 'Out for delivery';
    case 'delivered': return 'Package delivered successfully';
    default: return 'Status updated';
  }
}

// Generate simulation route with realistic Egypt coordinates
function generateSimulationRoute(startLat: number, startLng: number, endLat: number, endLng: number, points: number) {
  const route = [];
  const deltaLat = (endLat - startLat) / points;
  const deltaLng = (endLng - startLng) / points;
  
  for (let i = 0; i <= points; i++) {
    const lat = startLat + (deltaLat * i);
    const lng = startLng + (deltaLng * i);
    const timestamp = new Date(Date.now() + (i * 2 * 60 * 1000)).toISOString(); // Every 2 minutes
    
    route.push({
      lat,
      lng,
      timestamp,
      accuracy: Math.random() * 10 + 5, // 5-15 meters accuracy
      speed: Math.random() * 30 + 20, // 20-50 km/h
      heading: Math.random() * 360
    });
  }
  
  return route;
}

// Calculate route distance
function calculateRouteDistance(route: any[]) {
  let totalDistance = 0;
  for (let i = 1; i < route.length; i++) {
    const distance = haversineDistance(
      route[i-1].lat, route[i-1].lng,
      route[i].lat, route[i].lng
    );
    totalDistance += distance;
  }
  return Math.round(totalDistance * 100) / 100;
}

// Haversine distance formula
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}