// src/app/lib/types.ts

export interface ExtractedText {
  businessNames: string[];
  addresses: string[];
  phoneNumbers: string[];
  websites: string[];
  emails: string[];
  otherText: string[];
  confidence: {
    businessName: 'High' | 'Medium' | 'Low';
    address: 'High' | 'Medium' | 'Low';
    phone: 'High' | 'Medium' | 'Low';
  };
}

export interface PlacesResult {
  place_id: string;
  name: string;
  formatted_address: string;
  international_phone_number?: string;
  website?: string;
  business_status?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
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

export interface BusinessData {
  businessName: string;
  businessType: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  description: string;
  location: string;
  hours: string;
  rating?: number;
  reviews?: number;
  valuation?: ValuationResult; // NEW: Optional valuation data
  ownerInfo: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  relevance: number;
}

export interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface FormData {
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}