import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request data
    const requestData = await req.json();
    const { action, data } = requestData;

    let result = null;

    switch (action) {
      case 'get_pharmacies':
        result = await getPharmacies(supabase, data);
        break;
      
      case 'get_pharmacy_details':
        result = await getPharmacyDetails(supabase, data);
        break;
      
      case 'get_inventory':
        result = await getInventory(supabase, data);
        break;
      
      case 'sync_inventory':
        result = await syncInventory(supabase, data);
        break;
      
      case 'route_prescription':
        result = await routePrescription(supabase, data);
        break;
      
      case 'update_prescription_status':
        result = await updatePrescriptionStatus(supabase, data);
        break;
      
      case 'get_performance_metrics':
        result = await getPerformanceMetrics(supabase, data);
        break;
      
      case 'get_quality_records':
        result = await getQualityRecords(supabase, data);
        break;
      
      case 'verify_pharmacy':
        result = await verifyPharmacy(supabase, data);
        break;
      
      case 'get_routing_history':
        result = await getRoutingHistory(supabase, data);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Pharmacy Network API Error:', error);
    
    // Return error response
    const errorResponse = {
      success: false,
      error: {
        code: 'PHARMACY_NETWORK_ERROR',
        message: error.message
      }
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Get pharmacies with filtering and location-based sorting
async function getPharmacies(supabase: any, data: any) {
  const { 
    latitude, 
    longitude, 
    radius = 25, 
    verified_only = true, 
    service_filter,
    limit = 50 
  } = data;

  let query = supabase
    .from('pharmacies')
    .select(`
      id,
      name,
      name_ar,
      address,
      city,
      district,
      phone,
      email,
      rating,
      latitude,
      longitude,
      verified,
      quality_score,
      monthly_orders,
      average_delivery_time,
      insurance_accepted,
      payment_methods,
      services
    `)
    .limit(limit);

  // Apply verification filter
  if (verified_only) {
    query = query.eq('verified', true);
  }

  // Apply service filter
  if (service_filter) {
    query = query.contains('services', [service_filter]);
  }

  const { data: pharmacies, error } = await query;

  if (error) throw error;

  // Calculate distances and sort if coordinates provided
  if (latitude && longitude && pharmacies) {
    pharmacies.forEach((pharmacy: any) => {
      pharmacy.distance = calculateDistance(
        latitude,
        longitude,
        pharmacy.latitude,
        pharmacy.longitude
      );
    });

    // Filter by radius and sort by distance
    pharmacies
      .filter((pharmacy: any) => pharmacy.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance);
  }

  return pharmacies || [];
}

// Get detailed pharmacy information
async function getPharmacyDetails(supabase: any, data: any) {
  const { pharmacy_id } = data;

  const { data: pharmacy, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', pharmacy_id)
    .single();

  if (error) throw error;
  if (!pharmacy) throw new Error('Pharmacy not found');

  // Get additional statistics
  const { data: stats } = await supabase
    .from('pharmacy_performance_metrics')
    .select('*')
    .eq('pharmacy_id', pharmacy_id)
    .order('metric_date', { ascending: false })
    .limit(30);

  return {
    pharmacy,
    performance_stats: stats || []
  };
}

// Get pharmacy inventory
async function getInventory(supabase: any, data: any) {
  const { pharmacy_id, product_search } = data;

  let query = supabase
    .from('inventory_sync_logs')
    .select('*')
    .eq('pharmacy_id', pharmacy_id)
    .eq('sync_status', 'success');

  if (product_search) {
    query = query.or(`product_name.ilike.%${product_search}%,product_name_ar.ilike.%${product_search}%`);
  }

  const { data: inventory, error } = await query
    .order('last_updated', { ascending: false })
    .limit(100);

  if (error) throw error;
  return inventory || [];
}

// Sync inventory for a pharmacy
async function syncInventory(supabase: any, data: any) {
  const { pharmacy_id, inventory_items } = data;

  // Validate inventory items
  if (!Array.isArray(inventory_items)) {
    throw new Error('Inventory items must be an array');
  }

  const results = [];
  
  for (const item of inventory_items) {
    const { error } = await supabase
      .from('inventory_sync_logs')
      .upsert([{
        pharmacy_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_name_ar: item.product_name_ar,
        stock_quantity: item.stock_quantity,
        price: item.price,
        sync_status: 'success',
        sync_source: 'api',
        last_updated: new Date().toISOString()
      }], {
        onConflict: 'pharmacy_id,product_id'
      });

    if (error) {
      results.push({
        product_id: item.product_id,
        success: false,
        error: error.message
      });
    } else {
      results.push({
        product_id: item.product_id,
        success: true
      });
    }
  }

  return {
    synced_count: results.filter(r => r.success).length,
    failed_count: results.filter(r => !r.success).length,
    results
  };
}

// Route prescription to a pharmacy
async function routePrescription(supabase: any, data: any) {
  const {
    pharmacy_id,
    prescription_id,
    patient_id,
    medication_name,
    medication_name_ar,
    dosage,
    quantity,
    delivery_address,
    notes
  } = data;

  // Calculate estimated ready time (default: 2 hours from now)
  const estimatedReadyTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const { data: prescription, error } = await supabase
    .from('prescription_routing_history')
    .insert([{
      pharmacy_id,
      prescription_id,
      patient_id,
      medication_name,
      medication_name_ar,
      dosage,
      quantity,
      delivery_address,
      notes,
      status: 'routed',
      routed_at: new Date().toISOString(),
      estimated_ready_time: estimatedReadyTime
    }])
    .select()
    .single();

  if (error) throw error;
  return prescription;
}

// Update prescription status
async function updatePrescriptionStatus(supabase: any, data: any) {
  const { prescription_id, status, delivery_time, notes } = data;

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (delivery_time) {
    updateData.actual_delivery_time = delivery_time;
  }

  if (notes) {
    updateData.notes = notes;
  }

  const { data: prescription, error } = await supabase
    .from('prescription_routing_history')
    .update(updateData)
    .eq('id', prescription_id)
    .select()
    .single();

  if (error) throw error;
  return prescription;
}

// Get performance metrics for a pharmacy
async function getPerformanceMetrics(supabase: any, data: any) {
  const { pharmacy_id, days = 30 } = data;

  const { data: metrics, error } = await supabase
    .from('pharmacy_performance_metrics')
    .select('*')
    .eq('pharmacy_id', pharmacy_id)
    .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('metric_date', { ascending: true });

  if (error) throw error;

  // Aggregate metrics
  if (metrics && metrics.length > 0) {
    const aggregated = metrics.reduce((acc: any, curr: any) => ({
      total_orders: acc.total_orders + curr.total_orders,
      completed_orders: acc.completed_orders + curr.completed_orders,
      cancelled_orders: acc.cancelled_orders + curr.cancelled_orders,
      average_rating: (acc.average_rating + curr.average_rating) / 2,
      customer_complaints: acc.customer_complaints + curr.customer_complaints,
      response_time_avg: (acc.response_time_avg + curr.response_time_avg) / 2,
      delivery_time_avg: (acc.delivery_time_avg + curr.delivery_time_avg) / 2,
      inventory_accuracy: (acc.inventory_accuracy + curr.inventory_accuracy) / 2,
      revenue_generated: acc.revenue_generated + curr.revenue_generated
    }), {
      total_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      average_rating: 0,
      customer_complaints: 0,
      response_time_avg: 0,
      delivery_time_avg: 0,
      inventory_accuracy: 0,
      revenue_generated: 0
    });

    return {
      aggregated,
      daily_metrics: metrics
    };
  }

  return {
    aggregated: null,
    daily_metrics: []
  };
}

// Get quality assurance records for a pharmacy
async function getQualityRecords(supabase: any, data: any) {
  const { pharmacy_id } = data;

  const { data: records, error } = await supabase
    .from('quality_assurance_records')
    .select('*')
    .eq('pharmacy_id', pharmacy_id)
    .eq('status', 'active')
    .order('inspection_date', { ascending: false });

  if (error) throw error;
  return records || [];
}

// Verify a pharmacy (admin function)
async function verifyPharmacy(supabase: any, data: any) {
  const { pharmacy_id, verified, quality_score, license_number } = data;

  const updateData: any = {
    verified,
    updated_at: new Date().toISOString()
  };

  if (quality_score !== undefined) {
    updateData.quality_score = quality_score;
  }

  if (license_number) {
    updateData.license_number = license_number;
  }

  const { data: pharmacy, error } = await supabase
    .from('pharmacies')
    .update(updateData)
    .eq('id', pharmacy_id)
    .select()
    .single();

  if (error) throw error;
  return pharmacy;
}

// Get prescription routing history
async function getRoutingHistory(supabase: any, data: any) {
  const { 
    pharmacy_id, 
    patient_id, 
    status, 
    limit = 100,
    offset = 0 
  } = data;

  let query = supabase
    .from('prescription_routing_history')
    .select('*');

  if (pharmacy_id) {
    query = query.eq('pharmacy_id', pharmacy_id);
  }

  if (patient_id) {
    query = query.eq('patient_id', patient_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: history, error } = await query
    .order('routed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return history || [];
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}