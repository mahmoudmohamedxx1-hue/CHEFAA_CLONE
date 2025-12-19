import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface VoiceCommandRequest {
  transcript: string;
  language: 'ar' | 'en';
  sessionId?: string;
  userId?: string;
  context?: {
    currentPage?: string;
    previousQueries?: string[];
    cartItems?: any[];
  };
}

interface VoiceCommandResponse {
  success: boolean;
  action?: string;
  parameters?: Record<string, any>;
  confidence?: number;
  suggestions?: string[];
  response?: string;
  data?: any;
}

// Medication and medical term mappings
const MEDICATION_MAPPINGS: Record<string, Record<string, string>> = {
  ar: {
    'إنسولين': 'insulin',
    'بنادول': 'panadol',
    'مسكن': 'painkiller',
    'مضاد حيوي': 'antibiotic',
    'فيتامين': 'vitamin',
    'ضغط الدم': 'blood_pressure',
    'السكري': 'diabetes',
    'برد': 'cold',
    'صداع': 'headache',
    'أسبرين': 'aspirin',
    'باراسيتامول': 'paracetamol',
    'أوميغا': 'omega',
    'كالسيوم': 'calcium',
    'حديد': 'iron',
    'مغنيسيوم': 'magnesium'
  },
  en: {
    'insulin': 'insulin',
    'panadol': 'panadol',
    'painkiller': 'painkiller',
    'antibiotic': 'antibiotic',
    'vitamin': 'vitamin',
    'blood pressure': 'blood_pressure',
    'diabetes': 'diabetes',
    'cold': 'cold',
    'headache': 'headache',
    'aspirin': 'aspirin',
    'paracetamol': 'paracetamol',
    'omega': 'omega',
    'calcium': 'calcium',
    'iron': 'iron',
    'magnesium': 'magnesium'
  }
};

// Navigation mappings
const NAVIGATION_MAPPINGS: Record<string, Record<string, string>> = {
  ar: {
    'سلة التسوق': 'cart',
    'الوصفات': 'prescriptions',
    'الملف الشخصي': 'profile',
    'الرئيسية': 'home',
    'البحث': 'search',
    'إتمام الشراء': 'checkout',
    'حسابي': 'account',
    'الطلبات': 'orders'
  },
  en: {
    'cart': 'cart',
    'shopping cart': 'cart',
    'basket': 'cart',
    'prescriptions': 'prescriptions',
    'medical records': 'prescriptions',
    'profile': 'profile',
    'account': 'profile',
    'home': 'home',
    'search': 'search',
    'checkout': 'checkout',
    'orders': 'orders'
  }
};

// Action keywords
const ACTION_KEYWORDS: Record<string, Record<string, string[]>> = {
  search: {
    ar: ['ابحث عن', 'أريد', 'احتاج', 'وجدني', 'دور عن'],
    en: ['search for', 'find', 'look for', 'show me', 'I need']
  },
  add_to_cart: {
    ar: ['أضف للسلة', 'ضع في السلة', 'اشتري', 'أضف', 'احصل على'],
    en: ['add to cart', 'put in cart', 'buy', 'add', 'purchase']
  },
  remove_from_cart: {
    ar: ['احذف من السلة', 'امسح من السلة', 'أزل من السلة'],
    en: ['remove from cart', 'remove', 'delete from cart']
  },
  navigate: {
    ar: ['اذهب إلى', 'انتقل إلى', 'فتح', 'عرض'],
    en: ['go to', 'navigate to', 'open', 'show', 'view']
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: VoiceCommandRequest = await req.json();
    const { transcript, language, sessionId, userId, context } = requestData;

    if (!transcript || !language) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: transcript, language' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the voice command
    const result = await processVoiceCommand(transcript, language, {
      sessionId,
      userId,
      context
    });

    // Log the command
    await logVoiceCommand(transcript, result, language, sessionId, userId);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Voice command processing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process voice command',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processVoiceCommand(
  transcript: string,
  language: 'ar' | 'en',
  options: {
    sessionId?: string;
    userId?: string;
    context?: any;
  }
): Promise<VoiceCommandResponse> {
  const normalizedText = normalizeText(transcript, language);
  
  // Detect intent
  const intent = await detectIntent(normalizedText, language, options.context);
  
  // Generate response based on intent
  const response = await generateResponse(intent, language);
  
  // Get relevant data if needed
  let data = null;
  if (intent.action === 'search') {
    data = await searchMedications(intent.parameters.query, language);
  } else if (intent.action === 'add_to_cart') {
    data = await addToCart(options.userId, intent.parameters.productId, intent.parameters.quantity);
  }

  return {
    success: true,
    action: intent.action,
    parameters: intent.parameters,
    confidence: intent.confidence,
    response: response.message,
    suggestions: response.suggestions,
    data
  };
}

function normalizeText(text: string, language: 'ar' | 'en'): string {
  let normalized = text.toLowerCase().trim();
  
  // Remove common filler words
  const fillerWords = language === 'ar' 
    ? ['من فضلك', 'هل يمكنك', 'يمكنك', 'من فضلك قم']
    : ['please', 'can you', 'could you', 'might you', 'would you'];
  
  fillerWords.forEach(word => {
    normalized = normalized.replace(new RegExp(word, 'gi'), '');
  });
  
  return normalized.replace(/\s+/g, ' ').trim();
}

async function detectIntent(
  text: string,
  language: 'ar' | 'en',
  context?: any
): Promise<{
  action: string;
  parameters: Record<string, any>;
  confidence: number;
}> {
  // Check for navigation intent
  const navigation = detectNavigation(text, language);
  if (navigation) {
    return {
      action: 'navigate',
      parameters: { page: navigation },
      confidence: 0.9
    };
  }

  // Check for cart actions
  const cartAction = detectCartAction(text, language);
  if (cartAction) {
    return {
      action: cartAction.action,
      parameters: cartAction.parameters,
      confidence: 0.85
    };
  }

  // Check for medical-specific actions
  const medicalAction = detectMedicalAction(text, language);
  if (medicalAction) {
    return medicalAction;
  }

  // Default to search
  const searchTerms = extractSearchTerms(text, language);
  
  return {
    action: 'search',
    parameters: { query: searchTerms.query, category: searchTerms.category },
    confidence: searchTerms.query ? 0.75 : 0.5
  };
}

function detectNavigation(text: string, language: 'ar' | 'en'): string | null {
  const navMap = NAVIGATION_MAPPINGS[language];
  
  for (const [phrase, target] of Object.entries(navMap)) {
    if (text.includes(phrase)) {
      return target;
    }
  }
  
  return null;
}

function detectCartAction(text: string, language: 'ar' | 'en'): { action: string; parameters: Record<string, any> } | null {
  const addKeywords = ACTION_KEYWORDS.add_to_cart[language];
  const removeKeywords = ACTION_KEYWORDS.remove_from_cart[language];
  
  if (addKeywords.some(keyword => text.includes(keyword))) {
    const medication = extractMedicationName(text, language);
    const quantity = extractQuantity(text);
    
    return {
      action: 'add_to_cart',
      parameters: { medication, quantity }
    };
  }
  
  if (removeKeywords.some(keyword => text.includes(keyword))) {
    const medication = extractMedicationName(text, language);
    
    return {
      action: 'remove_from_cart',
      parameters: { medication }
    };
  }
  
  return null;
}

async function detectMedicalAction(text: string, language: 'ar' | 'en'): Promise<{ action: string; parameters: Record<string, any>; confidence: number } | null> {
  // Check for prescription-related queries
  const prescriptionKeywords = language === 'ar' 
    ? ['تاريخ الوصفات', 'وصفاتي', 'الوصفات الطبية']
    : ['prescription history', 'my prescriptions', 'medical records'];
  
  if (prescriptionKeywords.some(keyword => text.includes(keyword))) {
    return {
      action: 'view_prescriptions',
      parameters: {},
      confidence: 0.9
    };
  }
  
  // Check for refill requests
  const refillKeywords = language === 'ar'
    ? ['إعادة طلب', 'عيد الطلب', 'أعد الوصفة']
    : ['refill', 'reorder', 'repeat prescription'];
  
  if (refillKeywords.some(keyword => text.includes(keyword))) {
    const medication = extractMedicationName(text, language);
    return {
      action: 'refill_prescription',
      parameters: { medication },
      confidence: 0.85
    };
  }
  
  return null;
}

function extractSearchTerms(text: string, language: 'ar' | 'en'): { query: string; category?: string } {
  const medMap = MEDICATION_MAPPINGS[language];
  
  for (const [phrase, key] of Object.entries(medMap)) {
    if (text.includes(phrase)) {
      return {
        query: key,
        category: detectCategory(key, language)
      };
    }
  }
  
  return { query: '' };
}

function extractMedicationName(text: string, language: 'ar' | 'en'): string {
  const medMap = MEDICATION_MAPPINGS[language];
  
  for (const [phrase, key] of Object.entries(medMap)) {
    if (text.includes(phrase)) {
      return key;
    }
  }
  
  return '';
}

function extractQuantity(text: string): number | undefined {
  const numberMatch = text.match(/(\d+)/);
  if (numberMatch) {
    const quantity = parseInt(numberMatch[1]);
    return isNaN(quantity) ? undefined : quantity;
  }
  
  const quantityWords: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'single': 1, 'pair': 2,
    'واحد': 1, 'اثنان': 2, 'ثلاثة': 3
  };
  
  for (const [word, num] of Object.entries(quantityWords)) {
    if (text.includes(word)) {
      return num;
    }
  }
  
  return undefined;
}

function detectCategory(medication: string, language: 'ar' | 'en'): string {
  const categories: Record<string, string[]> = {
    pain_relief: ['panadol', 'aspirin', 'paracetamol', 'بنادول', 'أسبرين'],
    diabetes: ['insulin', 'إنسولين'],
    vitamins: ['vitamin', 'vitamin', 'فيتامين'],
    blood_pressure: ['blood_pressure', 'ضغط الدم'],
    antibiotics: ['antibiotic', 'مضاد حيوي']
  };
  
  for (const [category, medications] of Object.entries(categories)) {
    if (medications.includes(medication)) {
      return category;
    }
  }
  
  return 'general';
}

async function generateResponse(intent: { action: string; parameters: Record<string, any> }, language: 'ar' | 'en'): Promise<{ message: string; suggestions?: string[] }> {
  const responses: Record<string, Record<string, string>> = {
    search: {
      ar: 'جاري البحث عن النتائج...',
      en: 'Searching for results...'
    },
    add_to_cart: {
      ar: 'تمت إضافة المنتج للسلة',
      en: 'Product added to cart'
    },
    remove_from_cart: {
      ar: 'تم حذف المنتج من السلة',
      en: 'Product removed from cart'
    },
    navigate: {
      ar: 'جاري الانتقال...',
      en: 'Navigating...'
    },
    view_prescriptions: {
      ar: 'فتح السجلات الطبية',
      en: 'Opening medical records'
    }
  };
  
  const suggestions = getSuggestions(intent.action, language);
  
  return {
    message: responses[intent.action]?.[language] || 'Command processed',
    suggestions
  };
}

function getSuggestions(action: string, language: 'ar' | 'en'): string[] {
  const suggestions: Record<string, Record<string, string[]>> = {
    search: {
      ar: [
        'جرب البحث عن اسم محدد للدواء',
        'ابحث حسب الفئة',
        'استخدم اسم العلامة التجارية'
      ],
      en: [
        'Try searching for specific medication names',
        'Search by category',
        'Use brand names'
      ]
    },
    add_to_cart: {
      ar: [
        'تأكد من تحديد الكمية',
        'راجع تاريخ انتهاء الصلاحية',
        'استشر طبيبك إذا لزم الأمر'
      ],
      en: [
        'Make sure to specify quantity',
        'Check expiration dates',
        'Consult your doctor if needed'
      ]
    }
  };
  
  return suggestions[action]?.[language] || [];
}

async function searchMedications(query: string, language: 'ar' | 'en'): Promise<any[]> {
  // This would integrate with your product database
  // For now, return mock data
  return [
    {
      id: '1',
      name: query,
      category: 'medication',
      price: 25.99,
      inStock: true,
      language
    }
  ];
}

async function addToCart(userId: string | undefined, productId: string | undefined, quantity: number | undefined): Promise<any> {
  // This would integrate with your cart system
  // For now, return mock response
  return {
    success: true,
    message: 'Item added to cart',
    cartId: 'cart_' + Date.now()
  };
}

async function logVoiceCommand(
  transcript: string,
  result: VoiceCommandResponse,
  language: 'ar' | 'en',
  sessionId?: string,
  userId?: string
): Promise<void> {
  try {
    // This would integrate with Supabase logging
    console.log('Voice Command Log:', {
      transcript,
      action: result.action,
      parameters: result.parameters,
      confidence: result.confidence,
      language,
      sessionId,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log voice command:', error);
  }
}