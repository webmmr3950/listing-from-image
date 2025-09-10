/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/lib/valuation.ts

export interface ValuationFactors {
  businessType: string;
  location: string;
  rating?: number;
  reviewCount?: number;
  yearsInBusiness?: number;
  hasWebsite: boolean;
  webPresenceQuality: 'poor' | 'average' | 'good' | 'excellent';
  locationQuality: 'poor' | 'average' | 'good' | 'excellent';
  equipmentQuality: 'basic' | 'average' | 'good' | 'excellent';
  businessSize: 'micro' | 'small' | 'medium' | 'large';
  operatingHours: 'limited' | 'standard' | 'extended';
}

export interface ValuationResult {
  estimatedValue: {
    low: number;
    mid: number;
    high: number;
  };
  confidence: 'low' | 'medium' | 'high';
  factors: {
    factor: string;
    impact: 'negative' | 'neutral' | 'positive';
    description: string;
  }[];
  methodology: string;
  comparables?: string[];
}

const CATEGORY_VALUE_MAP: Record<string, string> = {
  Agriculture: 'agriculture',
  'Automotive & Boat': 'automotive_boat',
  'Beauty & Personal Care': 'beauty_personal_care',
  'Building & Construction': 'building_construction',
  'Communication & Media': 'communication_media',
  'Education & Children': 'education_children',
  'Entertainment & Recreation': 'entertainment_recreation',
  'Financial Services': 'financial_services',
  'Health Care & Fitness': 'health_care_fitness',
  Manufacturing: 'manufacturing',
  'Non-Classifiable Establishments': 'non_classifiable',
  'Online & Technology': 'online_technology',
  'Pet Services': 'pet_services',
  'Restaurants & Food': 'restaurants_food',
  Retail: 'retail',
  'Service Businesses': 'service_businesses',
  'Transportation & Storage': 'transportation_storage',
  Travel: 'travel',
  'Wholesale & Distribution': 'wholesale_distributors',
  Energy: 'energy',
  Engineering: 'engineering',
  'Franchise Resales': 'franchise_resales',
  Leisure: 'leisure',
  'Real Estate': 'real_estate',
  'Tech & Media': 'tech_media',
};

// Industry multipliers based on typical business sale multiples
const INDUSTRY_MULTIPLIERS = {
  'agriculture': { base: 120000, multiplier: 1.2, hasInventory: true },
  'automotive_boat': { base: 85000, multiplier: 1.0, hasInventory: true },
  'beauty_personal_care': { base: 45000, multiplier: 0.9, hasInventory: false },
  'building_construction': { base: 90000, multiplier: 1.1, hasInventory: true },
  'communication_media': { base: 75000, multiplier: 1.3, hasInventory: false },
  'education_children': { base: 60000, multiplier: 1.0, hasInventory: false },
  'entertainment_recreation': { base: 80000, multiplier: 0.85, hasInventory: true },
  'financial_services': { base: 150000, multiplier: 1.5, hasInventory: false },
  'health_care_fitness': { base: 110000, multiplier: 1.4, hasInventory: false },
  'manufacturing': { base: 200000, multiplier: 1.3, hasInventory: true },
  'non_classifiable': { base: 50000, multiplier: 0.8, hasInventory: false },
  'online_technology': { base: 100000, multiplier: 1.8, hasInventory: false },
  'pet_services': { base: 55000, multiplier: 1.0, hasInventory: true },
  'restaurants_food': { base: 65000, multiplier: 0.75, hasInventory: true },
  'retail': { base: 70000, multiplier: 0.65, hasInventory: true },
  'service_businesses': { base: 55000, multiplier: 1.2, hasInventory: false },
  'transportation_storage': { base: 140000, multiplier: 1.1, hasInventory: true },
  'travel': { base: 75000, multiplier: 0.9, hasInventory: false },
  'wholesale_distributors': { base: 180000, multiplier: 1.0, hasInventory: true },
  'energy': { base: 250000, multiplier: 1.4, hasInventory: true },
  'engineering': { base: 120000, multiplier: 1.3, hasInventory: false },
  'franchise_resales': { base: 85000, multiplier: 1.0, hasInventory: true },
  'leisure': { base: 70000, multiplier: 0.8, hasInventory: true },
  'real_estate': { base: 95000, multiplier: 1.2, hasInventory: false },
  'tech_media': { base: 110000, multiplier: 1.6, hasInventory: false },
  'default': { base: 60000, multiplier: 0.9, hasInventory: false }
};

// Location multipliers based on typical market conditions
const LOCATION_MULTIPLIERS = {
  'excellent': 1.4, // Prime location, high foot traffic
  'good': 1.2,      // Good visibility, decent traffic
  'average': 1.0,   // Standard commercial location
  'poor': 0.7       // Poor location, low visibility
};

const RATING_MULTIPLIERS = {
  4.5: 1.3,  // Exceptional reputation
  4.0: 1.2,  // Very good reputation
  3.5: 1.1,  // Good reputation
  3.0: 1.0,  // Average reputation
  2.5: 0.9,  // Below average
  2.0: 0.8   // Poor reputation
};

// Add this improved categorization function to your valuation.ts

export function categorizeBusinessIndustry(businessType: string, placesTypes?: string[]): string {
  const type = businessType.toLowerCase();
  
  // Check places types first for more accurate categorization
  if (placesTypes) {
    for (const placeType of placesTypes) {
      const category = mapPlaceTypeToCategory(placeType);
      if (category !== 'Non-Classifiable Establishments') {
        return category;
      }
    }
  }
  
  // Enhanced food-related keyword detection
  const foodKeywords = [
    'food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'bar', 'grill',
    'kitchen', 'dining', 'eatery', 'bistro', 'deli', 'bakery', 'market',
    'food park', 'food court', 'food truck', 'catering', 'barbecue', 'bbq'
  ];
  
  const retailKeywords = [
    'store', 'shop', 'retail', 'market', 'boutique', 'outlet', 'mall', 'plaza'
  ];
  
  const serviceKeywords = [
    'service', 'repair', 'consulting', 'cleaning', 'maintenance', 'support'
  ];

  // Check for food-related businesses first (most common in images)
  if (foodKeywords.some(keyword => type.includes(keyword))) {
    return 'Restaurants & Food';
  }
  
  // Check for retail businesses
  if (retailKeywords.some(keyword => type.includes(keyword))) {
    return 'Retail';
  }
  
  // Check for automotive businesses
  if (type.includes('auto') || type.includes('car') || type.includes('vehicle') || type.includes('boat')) {
    return 'Automotive & Boat';
  }
  
  // Check for beauty businesses
  if (type.includes('beauty') || type.includes('salon') || type.includes('spa') || type.includes('hair')) {
    return 'Beauty & Personal Care';
  }
  
  // Check for construction businesses
  if (type.includes('construction') || type.includes('contractor') || type.includes('building')) {
    return 'Building & Construction';
  }
  
  // Check for health/fitness businesses
  if (type.includes('medical') || type.includes('health') || type.includes('dental') || type.includes('fitness') || type.includes('gym')) {
    return 'Health Care & Fitness';
  }
  
  // Check for technology businesses
  if (type.includes('tech') || type.includes('software') || type.includes('online') || type.includes('digital') || type.includes('app') || type.includes('web') || type.includes('internet')) {
    return 'Online & Technology';
  }
  
  // Check for service businesses
  if (serviceKeywords.some(keyword => type.includes(keyword))) {
    return 'Service Businesses';
  }
  
  // Check for financial businesses
  if (type.includes('financial') || type.includes('accounting') || type.includes('insurance')) {
    return 'Financial Services';
  }
  
  // Check for entertainment businesses
  if (type.includes('entertainment') || type.includes('recreation') || type.includes('gaming')) {
    return 'Entertainment & Recreation';
  }
  
  return 'Non-Classifiable Establishments';
}

function mapPlaceTypeToCategory(placeType: string): string {
  const typeMap: Record<string, string> = {
    'restaurant': 'Restaurants & Food',
    'food': 'Restaurants & Food',
    'meal_takeaway': 'Restaurants & Food',
    'bakery': 'Restaurants & Food',
    'cafe': 'Restaurants & Food',
    'bar': 'Restaurants & Food',
    'store': 'Retail',
    'clothing_store': 'Retail',
    'electronics_store': 'Retail',
    'grocery_or_supermarket': 'Retail',
    'pharmacy': 'Retail',
    'book_store': 'Retail',
    'car_dealer': 'Automotive & Boat',
    'car_repair': 'Automotive & Boat',
    'gas_station': 'Automotive & Boat',
    'beauty_salon': 'Beauty & Personal Care',
    'spa': 'Beauty & Personal Care',
    'hair_care': 'Beauty & Personal Care',
    'gym': 'Health Care & Fitness',
    'hospital': 'Health Care & Fitness',
    'dentist': 'Health Care & Fitness',
    'doctor': 'Health Care & Fitness',
    'physiotherapist': 'Health Care & Fitness',
    'bank': 'Financial Services',
    'atm': 'Financial Services',
    'insurance_agency': 'Financial Services',
    'accounting': 'Financial Services',
    'real_estate_agency': 'Real Estate',
    'moving_company': 'Transportation & Storage',
    'taxi_stand': 'Transportation & Storage',
    'travel_agency': 'Travel',
    'lodging': 'Travel',
    'tourist_attraction': 'Entertainment & Recreation',
    'amusement_park': 'Entertainment & Recreation',
    'movie_theater': 'Entertainment & Recreation',
    'school': 'Education & Children',
    'university': 'Education & Children',
    'pet_store': 'Pet Services',
    'veterinary_care': 'Pet Services',
  };
  
  return typeMap[placeType] || 'Non-Classifiable Establishments';
}

function findIndustryMatch(businessCategory: string): string {
  // Convert category name to value key
  const categoryKey = CATEGORY_VALUE_MAP[businessCategory];
  return categoryKey || 'default';
}

export function estimateBusinessValue(factors: ValuationFactors): ValuationResult {
  console.log('🏷️ Starting business valuation with factors:', factors);

  // 1. Get base industry valuation using the proper category
  const industryKey = findIndustryMatch(factors.businessType);
  const industryData = INDUSTRY_MULTIPLIERS[industryKey as keyof typeof INDUSTRY_MULTIPLIERS] || INDUSTRY_MULTIPLIERS.default;
  
  let baseValue = industryData.base;
  const multiplier = industryData.multiplier;

  console.log(`📊 Base industry data for "${industryKey}":`, { baseValue, multiplier });

  // 2. Apply location multiplier
  const locationMultiplier = LOCATION_MULTIPLIERS[factors.locationQuality] || 1.0;
  baseValue *= locationMultiplier;

  // 3. Apply rating multiplier
  let ratingMultiplier = 1.0;
  if (factors.rating && factors.reviewCount && factors.reviewCount > 10) {
    ratingMultiplier = getRatingMultiplier(factors.rating);
  }
  baseValue *= ratingMultiplier;

  // 4. Years in business multiplier
  let ageMultiplier = 1.0;
  if (factors.yearsInBusiness) {
    if (factors.yearsInBusiness >= 10) ageMultiplier = 1.3;
    else if (factors.yearsInBusiness >= 5) ageMultiplier = 1.2;
    else if (factors.yearsInBusiness >= 2) ageMultiplier = 1.1;
    else ageMultiplier = 0.9; // New business discount
  }
  baseValue *= ageMultiplier;

  // 5. Web presence multiplier
  const webMultiplier = factors.hasWebsite ? 
    (factors.webPresenceQuality === 'excellent' ? 1.15 : 
     factors.webPresenceQuality === 'good' ? 1.1 : 
     factors.webPresenceQuality === 'average' ? 1.05 : 1.0) : 0.95;
  baseValue *= webMultiplier;

  // 6. Equipment/assets multiplier
  const equipmentMultiplier = 
    factors.equipmentQuality === 'excellent' ? 1.2 :
    factors.equipmentQuality === 'good' ? 1.1 :
    factors.equipmentQuality === 'average' ? 1.0 : 0.9;
  baseValue *= equipmentMultiplier;

  // 7. Business size multiplier
  const sizeMultiplier = 
    factors.businessSize === 'large' ? 1.3 :
    factors.businessSize === 'medium' ? 1.2 :
    factors.businessSize === 'small' ? 1.0 : 0.8;
  baseValue *= sizeMultiplier;

  // 8. Operating hours impact
  const hoursMultiplier = 
    factors.operatingHours === 'extended' ? 1.1 :
    factors.operatingHours === 'standard' ? 1.0 : 0.9;
  baseValue *= hoursMultiplier;

  // Calculate range (typically ±20-30% for small businesses)
  const midValue = Math.round(baseValue);
  const lowValue = Math.round(midValue * 0.7);
  const highValue = Math.round(midValue * 1.3);

  // Determine confidence level
  const confidence = calculateConfidence(factors);

  // Generate valuation factors explanation
  const valuationFactors = generateValuationFactors(factors, {
    locationMultiplier,
    ratingMultiplier,
    ageMultiplier,
    webMultiplier,
    equipmentMultiplier,
    sizeMultiplier,
    hoursMultiplier
  });

  const result: ValuationResult = {
    estimatedValue: {
      low: lowValue,
      mid: midValue,
      high: highValue
    },
    confidence,
    factors: valuationFactors,
    methodology: `Valuation based on industry multiples for ${industryKey} businesses, adjusted for location quality, reputation, business age, web presence, and operational factors.`,
    comparables: generateComparables(factors.businessType)
  };

  console.log('💰 Valuation completed:', {
    range: `$${lowValue.toLocaleString()} - $${highValue.toLocaleString()}`,
    confidence,
    factorsConsidered: valuationFactors.length
  });

  return result;
}

function getRatingMultiplier(rating: number): number {
  if (rating >= 4.5) return RATING_MULTIPLIERS[4.5];
  if (rating >= 4.0) return RATING_MULTIPLIERS[4.0];
  if (rating >= 3.5) return RATING_MULTIPLIERS[3.5];
  if (rating >= 3.0) return RATING_MULTIPLIERS[3.0];
  if (rating >= 2.5) return RATING_MULTIPLIERS[2.5];
  return RATING_MULTIPLIERS[2.0];
}

function calculateConfidence(factors: ValuationFactors): 'low' | 'medium' | 'high' {
  let score = 0;
  
  // Rating data availability and quality
  if (factors.rating && factors.reviewCount) {
    if (factors.reviewCount >= 50) score += 2;
    else if (factors.reviewCount >= 20) score += 1;
  }
  
  // Years in business
  if (factors.yearsInBusiness && factors.yearsInBusiness >= 2) score += 1;
  
  // Web presence
  if (factors.hasWebsite) score += 1;
  
  // Business type specificity
  if (factors.businessType !== 'Business' && factors.businessType !== 'default') score += 1;
  
  // Location data quality
  if (factors.locationQuality === 'good' || factors.locationQuality === 'excellent') score += 1;
  
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function generateValuationFactors(factors: ValuationFactors, multipliers: any) {
  const result = [];
  
  if (multipliers.locationMultiplier > 1.1) {
    result.push({
      factor: 'Prime Location',
      impact: 'positive' as const,
      description: `Excellent location increases value by ${Math.round((multipliers.locationMultiplier - 1) * 100)}%`
    });
  } else if (multipliers.locationMultiplier < 0.9) {
    result.push({
      factor: 'Poor Location',
      impact: 'negative' as const,
      description: `Below-average location reduces value by ${Math.round((1 - multipliers.locationMultiplier) * 100)}%`
    });
  }
  
  if (factors.rating && factors.rating >= 4.0 && factors.reviewCount && factors.reviewCount > 10) {
    result.push({
      factor: 'Strong Reputation',
      impact: 'positive' as const,
      description: `High rating (${factors.rating}) with ${factors.reviewCount} reviews adds premium`
    });
  }
  
  if (factors.yearsInBusiness && factors.yearsInBusiness >= 5) {
    result.push({
      factor: 'Established Business',
      impact: 'positive' as const,
      description: `${factors.yearsInBusiness} years in business demonstrates stability`
    });
  }
  
  if (factors.hasWebsite && factors.webPresenceQuality === 'excellent') {
    result.push({
      factor: 'Strong Online Presence',
      impact: 'positive' as const,
      description: 'Professional website and digital marketing increase value'
    });
  }
  
  if (factors.equipmentQuality === 'excellent') {
    result.push({
      factor: 'Quality Equipment/Assets',
      impact: 'positive' as const,
      description: 'High-quality equipment and fixtures add tangible value'
    });
  }
  
  return result;
}

function generateComparables(businessType: string): string[] {
  const type = businessType.toLowerCase();
  
  if (type.includes('restaurants & food')) {
    return [
      'Local restaurants sold $40K-$120K',
      'Food service businesses $50K-$150K',
      'Quick service concepts premium 10-20%'
    ];
  }
  
  if (type.includes('retail')) {
    return [
      'Small retail stores $30K-$80K',
      'Specialty retail $40K-$100K',
      'Prime location retail premium 30%'
    ];
  }
  
  return [
    `Similar ${businessType.toLowerCase()} businesses in area`,
    'Local market comparables',
    'Industry benchmark multiples'
  ];
}