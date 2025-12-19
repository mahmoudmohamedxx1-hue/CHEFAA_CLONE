// Barcode Lookup Edge Function
// Handles backend barcode scanning and product matching

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

interface BarcodeLookupRequest {
  barcode: string;
  context?: string;
  userId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ProductMatch {
  id: string;
  name: string;
  barcode: string;
  barcode_format: string;
  category: string;
  brand?: string;
  image_url?: string;
  price?: number;
  available: boolean;
  prescription_required?: boolean;
  active_ingredients?: string[];
  strength?: string;
  dosage_form?: string;
  manufacturer?: string;
  ndc?: string;
  confidence_score?: number;
  alternative_products?: ProductMatch[];
}

interface BarcodeResponse {
  success: boolean;
  product?: ProductMatch;
  alternatives?: ProductMatch[];
  message?: string;
  suggestions?: string[];
  confidence?: number;
  lookup_time_ms: number;
  barcode_format?: string;
}

// Sample product database (in production, this would query Supabase)
const productDatabase = [
  {
    id: 'panadol_500mg',
    name: 'Panadol 500mg Paracetamol Tablets',
    barcode: '5012345678900',
    barcode_format: 'EAN-13',
    category: 'Pain Relief',
    brand: 'Panadol',
    price: 8.99,
    available: true,
    prescription_required: false,
    active_ingredients: ['Paracetamol 500mg'],
    strength: '500mg',
    dosage_form: 'Tablet',
    manufacturer: 'GSK Consumer Healthcare',
    ndc: '00673-0123-12',
    image_url: 'https://example.com/images/panadol-500mg.jpg',
    confidence_score: 1.0
  },
  {
    id: 'panadol_extra',
    name: 'Panadol Extra 500mg/65mg Tablets',
    barcode: '5012345678901',
    barcode_format: 'EAN-13',
    category: 'Pain Relief',
    brand: 'Panadol',
    price: 12.99,
    available: true,
    prescription_required: false,
    active_ingredients: ['Paracetamol 500mg', 'Caffeine 65mg'],
    strength: '500mg/65mg',
    dosage_form: 'Tablet',
    manufacturer: 'GSK Consumer Healthcare',
    ndc: '00673-0124-12',
    image_url: 'https://example.com/images/panadol-extra.jpg',
    confidence_score: 1.0
  },
  {
    id: 'ibuprofen_200mg',
    name: 'Advil Ibuprofen 200mg Tablets',
    barcode: '3012345678902',
    barcode_format: 'EAN-13',
    category: 'Pain Relief',
    brand: 'Advil',
    price: 15.99,
    available: true,
    prescription_required: false,
    active_ingredients: ['Ibuprofen 200mg'],
    strength: '200mg',
    dosage_form: 'Tablet',
    manufacturer: 'Pfizer Consumer Healthcare',
    ndc: '0573-0010-12',
    image_url: 'https://example.com/images/advil-200mg.jpg',
    confidence_score: 1.0
  },
  {
    id: 'aspirin_81mg',
    name: 'Aspirin Low Dose 81mg Tablets',
    barcode: '3012345678903',
    barcode_format: 'EAN-13',
    category: 'Cardiovascular',
    brand: 'Aspirin',
    price: 6.99,
    available: true,
    prescription_required: false,
    active_ingredients: ['Aspirin 81mg'],
    strength: '81mg',
    dosage_form: 'Tablet',
    manufacturer: 'Bayer Healthcare',
    ndc: '0573-0088-12',
    image_url: 'https://example.com/images/aspirin-81mg.jpg',
    confidence_score: 1.0
  },
  {
    id: 'antihistamine_10mg',
    name: 'Antihistamine 10mg Tablets',
    barcode: '4012345678904',
    barcode_format: 'EAN-13',
    category: 'Allergy',
    brand: 'Generic',
    price: 9.99,
    available: true,
    prescription_required: false,
    active_ingredients: ['Cetirizine Hydrochloride 10mg'],
    strength: '10mg',
    dosage_form: 'Tablet',
    manufacturer: 'Generic Pharmaceutical',
    ndc: '12345-067-12',
    image_url: 'https://example.com/images/antihistamine.jpg',
    confidence_score: 1.0
  },
  {
    id: 'vitamin_c_500mg',
    name: 'Vitamin C 500mg Tablets',
    barcode: '5012345678905',
    barcode_format: 'EAN-13',
    category: 'Vitamins',
    brand: "Nature's Best",
    price: 7.99,
    available: true,
    prescription_required: false,
    active_ingredients: ['Ascorbic Acid 500mg'],
    strength: '500mg',
    dosage_form: 'Tablet',
    manufacturer: "Nature's Best",
    ndc: '23456-078-12',
    image_url: 'https://example.com/images/vitamin-c.jpg',
    confidence_score: 1.0
  },
  {
    id: 'insulin_lantus',
    name: 'Lantus Insulin Glargine 100 Units/mL',
    barcode: '6012345678906',
    barcode_format: 'EAN-13',
    category: 'Diabetes',
    brand: 'Lantus',
    price: 125.99,
    available: true,
    prescription_required: true,
    active_ingredients: ['Insulin Glargine'],
    strength: '100 Units/mL',
    dosage_form: 'Injection',
    manufacturer: 'Sanofi-Aventis',
    ndc: '0002-7887-01',
    image_url: 'https://example.com/images/lantus.jpg',
    confidence_score: 1.0
  }
];

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Detect barcode format from string
 */
function detectBarcodeFormat(barcode: string): string {
  const patterns = {
    'UPC-A': /^\d{12}$/,
    'UPC-E': /^\d{8}$/,
    'EAN-13': /^\d{13}$/,
    'EAN-8': /^\d{8}$/,
    'Code128': /^[A-Za-z0-9\s\-\.\/\+]+$/,
    'Code39': /^[A-Za-z0-9\-\.\$\/\+\%\s]+$/,
    'QR': /^https?:\/\/.+/
  };

  for (const [format, pattern] of Object.entries(patterns)) {
    if (pattern.test(barcode)) {
      return format;
    }
  }
  return 'Unknown';
}

/**
 * Validate barcode using checksum algorithms
 */
function validateBarcode(barcode: string, format: string): boolean {
  switch (format) {
    case 'EAN-13':
      return validateEAN13(barcode);
    case 'UPC-A':
      return validateUPCA(barcode);
    case 'EAN-8':
      return validateEAN8(barcode);
    default:
      return true;
  }
}

function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[12]);
}

function validateUPCA(barcode: string): boolean {
  return validateEAN13(barcode);
}

function validateEAN8(barcode: string): boolean {
  if (barcode.length !== 8) return false;
  
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[7]);
}

/**
 * Search products from database
 */
async function searchProductsFromDatabase(barcode: string): Promise<ProductMatch[]> {
  try {
    // Query Supabase products table
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .or(`barcode.eq.${barcode},ndc.ilike.%${barcode}%,name.ilike.%${barcode}%`)
      .limit(10);

    if (error) {
      console.error('Database query error:', error);
      return [];
    }

    return products?.map(product => ({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      barcode_format: product.barcode_format || 'Unknown',
      category: product.category,
      brand: product.brand,
      image_url: product.image_url,
      price: product.price,
      available: product.available,
      prescription_required: product.prescription_required,
      active_ingredients: product.active_ingredients,
      strength: product.strength,
      dosage_form: product.dosage_form,
      manufacturer: product.manufacturer,
      ndc: product.ndc,
      confidence_score: 1.0
    })) || [];

  } catch (error) {
    console.error('Error querying database:', error);
    return [];
  }
}

/**
 * Find similar products using fuzzy matching
 */
function findSimilarProducts(barcode: string, products: ProductMatch[]): ProductMatch[] {
  const threshold = 2;
  const similar: ProductMatch[] = [];
  
  for (const product of products) {
    const distance = levenshteinDistance(barcode, product.barcode);
    if (distance <= threshold) {
      product.confidence_score = Math.max(0.6, 1.0 - (distance * 0.2));
      similar.push(product);
    }
  }
  
  return similar.slice(0, 5);
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Update scan analytics
 */
async function updateScanAnalytics(productId: string, userId?: string, context?: string): Promise<void> {
  try {
    // Log scan event
    await supabase
      .from('barcode_scan_analytics')
      .insert({
        product_id: productId,
        user_id: userId,
        context,
        scanned_at: new Date().toISOString(),
        user_agent: Deno.env.get('USER_AGENT') || 'unknown'
      });

    // Update product scan count
    await supabase
      .from('products')
      .update({ 
        scan_count: supabase.rpc('increment_scan_count', { product_id: productId }),
        last_scanned_at: new Date().toISOString()
      })
      .eq('id', productId);

  } catch (error) {
    console.error('Error updating scan analytics:', error);
  }
}

/**
 * Report unknown barcode for future database enhancement
 */
async function reportUnknownBarcode(barcode: string, userId?: string, context?: string): Promise<void> {
  try {
    await supabase
      .from('unknown_barcodes')
      .insert({
        barcode,
        user_id: userId,
        context,
        reported_at: new Date().toISOString(),
        user_agent: Deno.env.get('USER_AGENT') || 'unknown'
      });
  } catch (error) {
    console.error('Error reporting unknown barcode:', error);
  }
}

/**
 * Main barcode lookup function
 */
async function lookupBarcode(request: BarcodeLookupRequest): Promise<BarcodeResponse> {
  const startTime = Date.now();
  
  try {
    const { barcode, userId, context, location } = request;
    
    if (!barcode || barcode.trim().length === 0) {
      return {
        success: false,
        message: 'Barcode is required',
        lookup_time_ms: Date.now() - startTime,
        suggestions: ['Please provide a valid barcode']
      };
    }

    const cleanBarcode = barcode.replace(/[^\dA-Za-z]/g, '').toUpperCase();
    const barcodeFormat = detectBarcodeFormat(cleanBarcode);
    
    // Validate barcode format
    if (!validateBarcode(cleanBarcode, barcodeFormat)) {
      return {
        success: false,
        message: 'Invalid barcode checksum',
        lookup_time_ms: Date.now() - startTime,
        barcode_format: barcodeFormat,
        suggestions: [
          'Ensure barcode is complete and undamaged',
          'Try scanning again with better lighting',
          'Use manual entry if scanning fails'
        ]
      };
    }

    // Search in local database first (for demo purposes)
    let products = productDatabase.filter(p => 
      p.barcode === cleanBarcode || p.barcode === barcode
    );

    // If not found in local database, query Supabase
    if (products.length === 0) {
      products = await searchProductsFromDatabase(cleanBarcode);
    }

    if (products.length > 0) {
      const product = products[0];
      
      // Update analytics
      await updateScanAnalytics(product.id, userId, context);
      
      // Find alternatives
      const alternatives = products.slice(1);
      
      return {
        success: true,
        product,
        alternatives,
        lookup_time_ms: Date.now() - startTime,
        barcode_format: barcodeFormat,
        confidence: product.confidence_score,
        suggestions: [
          product.prescription_required ? 'Prescription required for purchase' : 'Available for purchase',
          alternatives.length > 0 ? `${alternatives.length} alternatives available` : undefined
        ].filter(Boolean) as string[]
      };
    }

    // Check for NDC matches
    const ndcPattern = /^\d{10,11}$/;
    if (ndcPattern.test(cleanBarcode)) {
      const ndcProducts = productDatabase.filter(p => 
        p.ndc && (p.ndc.includes(cleanBarcode) || cleanBarcode.includes(p.ndc.replace(/-/g, '')))
      );
      
      if (ndcProducts.length > 0) {
        const product = ndcProducts[0];
        await updateScanAnalytics(product.id, userId, context);
        
        return {
          success: true,
          product,
          alternatives: ndcProducts.slice(1),
          lookup_time_ms: Date.now() - startTime,
          barcode_format: barcodeFormat,
          confidence: 0.95,
          suggestions: ['Product matched using NDC code', 'Verify prescription compliance']
        };
      }
    }

    // Search for similar products (damaged barcode recovery)
    const allProducts = [...productDatabase];
    const similarProducts = findSimilarProducts(cleanBarcode, allProducts);
    
    if (similarProducts.length > 0) {
      return {
        success: false,
        message: 'Similar products found - barcode may be damaged',
        alternatives: similarProducts,
        lookup_time_ms: Date.now() - startTime,
        barcode_format: barcodeFormat,
        confidence: 0.6,
        suggestions: [
          'Check if barcode was scanned completely',
          'Ensure barcode is not damaged or obscured',
          'Try manual entry if results are unclear',
          `${similarProducts.length} similar products found below`
        ]
      };
    }

    // Report unknown barcode
    await reportUnknownBarcode(cleanBarcode, userId, context);
    
    return {
      success: false,
      message: 'Product not found in database',
      lookup_time_ms: Date.now() - startTime,
      barcode_format: barcodeFormat,
      suggestions: [
        'Verify barcode is correct and complete',
        'Product may not be in our inventory',
        'Contact pharmacy for assistance',
        'Barcode reported for future database enhancement'
      ]
    };

  } catch (error) {
    console.error('Barcode lookup error:', error);
    
    return {
      success: false,
      message: 'Error occurred during barcode lookup',
      lookup_time_ms: Date.now() - startTime,
      suggestions: [
        'Try again in a moment',
        'Check internet connection',
        'Contact support if problem persists'
      ]
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const requestData: BarcodeLookupRequest = await req.json();
      const result = await lookupBarcode(requestData);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (req.method === 'GET') {
      // Return health check or API info
      return new Response(JSON.stringify({
        success: true,
        message: 'Barcode Lookup API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Request handling error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});