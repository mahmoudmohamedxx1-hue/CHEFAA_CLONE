/**
 * Local SEO for Pharmacy
 * Google My Business, local citations, and pharmacy-specific local SEO
 */

export interface PharmacyLocation {
  id: string;
  name: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email?: string;
  website?: string;
  hours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  services: string[];
  deliveryAreas: string[];
  languages: string[];
  paymentMethods: string[];
  certifications: string[];
  images: string[];
  reviews: {
    rating: number;
    count: number;
    platform: string;
    url?: string;
  }[];
}

export interface LocalCitation {
  name: string;
  address: string;
  phone: string;
  website?: string;
  category: string;
  description: string;
  hours?: string;
  priceRange?: string;
  socialProfiles?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface LocalKeywordData {
  keyword: string;
  location: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: 'informational' | 'navigational' | 'transactional' | 'local';
  relatedTerms: string[];
}

export class LocalSEOManager {
  private baseUrl: string;
  private googleMyBusinessApi: any;
  
  constructor(baseUrl: string = 'https://chefaa.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate local business schema for pharmacy
   */
  generateLocalBusinessSchema(location: PharmacyLocation): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Pharmacy',
      '@id': `${this.baseUrl}/locations/${location.id}`,
      'name': location.name,
      'description': `Licensed pharmacy offering medications, health products, and pharmaceutical services in ${location.address.addressLocality}, Egypt`,
      'url': location.website || `${this.baseUrl}/locations/${location.id}`,
      'logo': `${this.baseUrl}/images/locations/${location.id}/logo.jpg`,
      'image': location.images.map(img => `${this.baseUrl}/images/locations/${location.id}/${img}`),
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': location.address.streetAddress,
        'addressLocality': location.address.addressLocality,
        'addressRegion': location.address.addressRegion,
        'postalCode': location.address.postalCode,
        'addressCountry': location.address.addressCountry
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': location.geo.latitude,
        'longitude': location.geo.longitude
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': location.phone,
        'contactType': 'customer service',
        'areaServed': 'EG',
        'availableLanguage': location.languages
      },
      'openingHours': this.formatOpeningHours(location.hours),
      'priceRange': 'EGP 10 - EGP 500',
      'paymentAccepted': location.paymentMethods,
      'currenciesAccepted': 'EGP',
      'areaServed': location.deliveryAreas.map(area => ({
        '@type': 'Place',
        'name': area
      })),
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'Pharmaceutical Services',
        'itemListElement': location.services.map((service, index) => ({
          '@type': 'Offer',
          'position': index + 1,
          'name': service,
          'category': 'Pharmaceutical Service'
        }))
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': location.reviews.reduce((sum, r) => sum + r.rating, 0) / location.reviews.length,
        'reviewCount': location.reviews.reduce((sum, r) => sum + r.count, 0),
        'bestRating': 5,
        'worstRating': 1
      },
      'hasCredential': location.certifications.map(cert => ({
        '@type': 'EducationalOccupationalCredential',
        'name': cert,
        'credentialCategory': 'Professional Certification'
      }))
    };
  }

  /**
   * Format opening hours for schema
   */
  private formatOpeningHours(hours: { [key: string]: { open: string; close: string; closed?: boolean } }): string[] {
    const formattedHours: string[] = [];
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    daysOrder.forEach(day => {
      const dayHours = hours[day];
      if (dayHours && !dayHours.closed) {
        formattedHours.push(`${day.charAt(0).toUpperCase() + day.slice(1)} ${dayHours.open}-${dayHours.close}`);
      } else if (dayHours && dayHours.closed) {
        formattedHours.push(`${day.charAt(0).toUpperCase() + day.slice(1)} Closed`);
      }
    });
    
    return formattedHours;
  }

  /**
   * Generate local landing page schema
   */
  generateLocalLandingPageSchema(location: PharmacyLocation, deliveryAreas: string[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${this.baseUrl}/delivery-areas/${location.address.addressLocality.toLowerCase()}`,
      'name': `Pharmacy Delivery in ${location.address.addressLocality}`,
      'description': `Fast and reliable pharmacy delivery service in ${location.address.addressLocality}. Prescriptions, medications, and health products delivered to your doorstep.`,
      'url': `${this.baseUrl}/delivery-areas/${location.address.addressLocality.toLowerCase()}`,
      'areaServed': [
        {
          '@type': 'City',
          'name': location.address.addressLocality
        },
        ...deliveryAreas.map(area => ({
          '@type': 'Place',
          'name': area
        }))
      ],
      'serviceType': 'Pharmacy Delivery',
      'availableService': location.services,
      'knowsAbout': [
        'Prescription Delivery',
        'Medication Delivery',
        'Health Products',
        'Pharmaceutical Consultation',
        'Medical Equipment'
      ]
    };
  }

  /**
   * Generate Google My Business optimization
   */
  generateGoogleMyBusinessOptimizations(location: PharmacyLocation): any {
    return {
      businessName: location.name,
      categories: [
        { primary: 'Pharmacy', secondary: ['Drugstore', 'Medical Supply Store'] }
      ],
      description: `Licensed pharmacy in ${location.address.addressLocality} offering prescription medications, over-the-counter drugs, health products, and pharmaceutical services. Fast delivery available.`,
      address: {
        streetAddress: location.address.streetAddress,
        addressLocality: location.address.addressLocality,
        addressRegion: location.address.addressRegion,
        postalCode: location.address.postalCode,
        countryCode: location.address.addressCountry
      },
      phone: location.phone,
      website: location.website,
      hours: location.hours,
      attributes: {
        'Wheelchair accessible entrance': true,
        'Credit cards accepted': true,
        'Parking available': true,
        'Delivery available': true,
        'Online ordering': true
      },
      specialHours: [],
      media: {
        photos: location.images.map(img => `${this.baseUrl}/images/locations/${location.id}/${img}`),
        logo: `${this.baseUrl}/images/locations/${location.id}/logo.jpg`
      },
      socialProfiles: {
        facebook: `${this.baseUrl}/facebook/chefaa-${location.id}`,
        twitter: `${this.baseUrl}/twitter/chefaa`,
        linkedin: `${this.baseUrl}/linkedin/chefaa`
      }
    };
  }

  /**
   * Generate local citations for Egyptian business directories
   */
  generateLocalCitations(location: PharmacyLocation): LocalCitation[] {
    return [
      {
        name: `${location.name} - Chefaa`,
        address: `${location.address.streetAddress}, ${location.address.addressLocality}, ${location.address.addressRegion}, ${location.address.postalCode}, Egypt`,
        phone: location.phone,
        website: location.website,
        category: 'Pharmacy',
        description: `Licensed pharmacy providing prescription medications, health products, and pharmaceutical services in ${location.address.addressLocality}, Egypt.`,
        hours: '24/7 Online Service',
        socialProfiles: {
          facebook: `${this.baseUrl}/facebook/chefaa`,
          twitter: `${this.baseUrl}/twitter/chefaa`,
          linkedin: `${this.baseUrl}/linkedin/chefaa`,
          instagram: `${this.baseUrl}/instagram/chefaa`
        }
      },
      {
        name: location.name,
        address: `${location.address.streetAddress}, ${location.address.addressLocality}, ${location.address.addressRegion}, ${location.address.postalCode}, Egypt`,
        phone: location.phone,
        category: 'Health & Medical',
        description: `Professional pharmacy services including prescription fulfillment, medication consultation, and health product delivery.`
      },
      {
        name: `Chefaa Pharmacy ${location.address.addressLocality}`,
        address: `${location.address.streetAddress}, ${location.address.addressLocality}, Egypt`,
        phone: location.phone,
        website: location.website,
        category: 'Drugstore',
        description: `Leading online and physical pharmacy in ${location.address.addressLocality} offering comprehensive pharmaceutical services and fast delivery.`
      }
    ];
  }

  /**
   * Generate local keyword strategy for Egyptian market
   */
  generateLocalKeywordStrategy(location: PharmacyLocation): LocalKeywordData[] {
    const city = location.address.addressLocality;
    const region = location.address.addressRegion;
    
    return [
      {
        keyword: `pharmacy ${city}`,
        location: city,
        searchVolume: 1200,
        difficulty: 65,
        cpc: 0.85,
        intent: 'local',
        relatedTerms: [`chemist ${city}`, `drugstore ${city}`, `medicine shop ${city}`]
      },
      {
        keyword: `pharmacy near me ${city}`,
        location: city,
        searchVolume: 890,
        difficulty: 60,
        cpc: 0.75,
        intent: 'local',
        relatedTerms: [`nearest pharmacy ${city}`, `24 hour pharmacy ${city}`]
      },
      {
        keyword: `prescription delivery ${city}`,
        location: city,
        searchVolume: 720,
        difficulty: 55,
        cpc: 1.20,
        intent: 'transactional',
        relatedTerms: [`medicine delivery ${city}`, `pharmacy delivery ${city}`, `online pharmacy ${city}`]
      },
      {
        keyword: `chemist ${city}`,
        location: city,
        searchVolume: 650,
        difficulty: 70,
        cpc: 0.90,
        intent: 'local',
        relatedTerms: [`chemist shop ${city}`, `pharmacy ${city}`]
      },
      {
        keyword: `drugstore ${city}`,
        location: city,
        searchVolume: 580,
        difficulty: 68,
        cpc: 0.95,
        intent: 'local',
        relatedTerms: [`pharmacy ${city}`, `medicine store ${city}`]
      },
      {
        keyword: `24 hour pharmacy ${city}`,
        location: city,
        searchVolume: 340,
        difficulty: 45,
        cpc: 1.10,
        intent: 'navigational',
        relatedTerms: [`emergency pharmacy ${city}`, `late night pharmacy ${city}`]
      },
      {
        keyword: `pharmacy insurance ${city}`,
        location: city,
        searchVolume: 280,
        difficulty: 50,
        cpc: 1.30,
        intent: 'informational',
        relatedTerms: [`health insurance pharmacy ${city}`, `covered medications ${city}`]
      }
    ];
  }

  /**
   * Generate local content strategy
   */
  generateLocalContentStrategy(location: PharmacyLocation): {
    pages: { title: string; url: string; description: string; keywords: string[] }[];
    blogTopics: { title: string; keywords: string[]; category: string }[];
  } {
    const city = location.address.addressLocality;
    const region = location.address.addressRegion;
    
    return {
      pages: [
        {
          title: `Pharmacy in ${city} - Chefaa`,
          url: `/pharmacy-${city.toLowerCase()}`,
          description: `Professional pharmacy services in ${city}. Prescription medications, health products, and pharmaceutical consultation available.`,
          keywords: [`pharmacy ${city}`, `medications ${city}`, `prescription ${city}`]
        },
        {
          title: `Prescription Delivery ${city} - Fast & Reliable`,
          url: `/prescription-delivery-${city.toLowerCase()}`,
          description: `Fast prescription delivery service in ${city}. Order online and get your medications delivered to your doorstep.`,
          keywords: [`prescription delivery ${city}`, `medicine delivery ${city}`, `pharmacy delivery ${city}`]
        },
        {
          title: `24 Hour Pharmacy ${city} - Emergency Medications`,
          url: `/24-hour-pharmacy-${city.toLowerCase()}`,
          description: `24/7 pharmacy services in ${city}. Emergency medications and late-night pharmacy services available.`,
          keywords: [`24 hour pharmacy ${city}`, `emergency pharmacy ${city}`, `late night pharmacy ${city}`]
        }
      ],
      blogTopics: [
        {
          title: `Best Pharmacies in ${city} - 2024 Guide`,
          keywords: [`best pharmacy ${city}`, `top pharmacies ${city}`, `pharmacy review ${city}`],
          category: 'Local Pharmacy Guide'
        },
        {
          title: `How to Find a Good Pharmacy in ${city}`,
          keywords: [`good pharmacy ${city}`, `reliable pharmacy ${city}`, `pharmacy services ${city}`],
          category: 'Pharmacy Guide'
        },
        {
          title: `Prescription Delivery Options in ${city}`,
          keywords: [`prescription delivery ${city}`, `medicine delivery ${city}`, `pharmacy delivery ${city}`],
          category: 'Delivery Services'
        },
        {
          title: `Health Insurance Coverage for Pharmacies in ${city}`,
          keywords: [`pharmacy insurance ${city}`, `health insurance ${city}`, `medication coverage ${city}`],
          category: 'Insurance'
        }
      ]
    };
  }

  /**
   * Generate local review management strategy
   */
  generateReviewManagementStrategy(): {
    platforms: string[];
    responseTemplates: { [key: string]: string };
    reviewRequests: { trigger: string; message: string; timing: string }[];
  } {
    return {
      platforms: [
        'Google My Business',
        'Facebook',
        'Yelp',
        'Yellow Pages',
        'Local Directories',
        'Healthcare Review Sites'
      ],
      responseTemplates: {
        positive: 'Thank you for your positive review! We\'re thrilled that you\'re satisfied with our pharmacy services. At Chefaa, we\'re committed to providing the highest quality pharmaceutical care to our community. Your health and satisfaction are our top priorities.',
        negative: 'We sincerely apologize for your negative experience. Your feedback is invaluable to us as we continuously strive to improve our services. Please contact us directly so we can address your concerns and make things right.',
        neutral: `Thank you for taking the time to leave us a review. We appreciate all feedback as it helps us provide better service to our community. If you have any specific questions or concerns, please don't hesitate to reach out to us directly.`
      },
      reviewRequests: [
        {
          trigger: 'Order completion',
          message: 'Thank you for your recent order! Would you mind leaving us a review? Your feedback helps us serve you and our community better.',
          timing: '24 hours after delivery'
        },
        {
          trigger: 'Pharmacy consultation',
          message: 'We hope our pharmaceutical consultation was helpful! If you have a moment, we would appreciate your feedback to help us improve our services.',
          timing: 'Immediately after consultation'
        },
        {
          trigger: 'Delivery feedback',
          message: 'How was your delivery experience? We would love to hear your thoughts to ensure we continue providing excellent service.',
          timing: 'Upon delivery confirmation'
        }
      ]
    };
  }

  /**
   * Generate local competitive analysis
   */
  generateCompetitiveAnalysis(location: PharmacyLocation): {
    competitors: { name: string; strength: string; weakness: string; strategy: string }[];
    opportunities: string[];
    threats: string[];
  } {
    return {
      competitors: [
        {
          name: 'Local Independent Pharmacies',
          strength: 'Personal service, local relationships',
          weakness: 'Limited inventory, no online presence',
          strategy: 'Emphasize online convenience and wider product selection'
        },
        {
          name: 'Chain Pharmacies',
          strength: 'Brand recognition, multiple locations',
          weakness: 'Less personalized service, limited local focus',
          strategy: 'Highlight local expertise and community involvement'
        },
        {
          name: 'Other Online Pharmacies',
          strength: 'Online presence, competitive pricing',
          weakness: 'Limited delivery areas, lack of local presence',
          strategy: 'Emphasize local delivery expertise and professional support'
        }
      ],
      opportunities: [
        'Underserved online pharmacy market in the area',
        'Growing demand for prescription delivery',
        'Limited local competition with strong online presence',
        'Partnership opportunities with local healthcare providers'
      ],
      threats: [
        'New online pharmacy competitors entering the market',
        'Changes in pharmaceutical regulations',
        'Economic downturn affecting healthcare spending',
        'Competition from international online pharmacies'
      ]
    };
  }
}

export default LocalSEOManager;