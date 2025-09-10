/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/process-business/route.ts
import { formatBusinessHours, searchBusiness } from '@/lib/places';
import { BusinessData, ExtractedText } from '@/lib/types';
import { searchBusinessOnWeb } from '@/lib/websearch';
import { categorizeBusinessIndustry, estimateBusinessValue, ValuationFactors } from '@/lib/valuation';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { extractedText } = await request.json();

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No extracted text provided' },
        { status: 400 }
      );
    }

    const businessName = extractedText.businessNames[0] || 'Unknown Business';
    console.log(`🔍 Running comprehensive analysis for: "${businessName}"`);

    // Run searches concurrently
    const [placesData, webData] = await Promise.all([
      searchBusiness(businessName, extractedText.addresses[0]).catch(err => {
        console.error('Places API error:', err);
        return null;
      }),
      searchBusinessOnWeb(businessName).catch(err => {
        console.error('Web search error:', err);
        return null;
      })
    ]);

    // Generate comprehensive business data
    const businessData = generateBusinessData(extractedText, placesData, webData);

    // Generate business valuation
    console.log('💰 Starting business valuation analysis...');
    const valuationFactors = extractValuationFactors(businessData, placesData, webData, extractedText);
    const valuation = estimateBusinessValue(valuationFactors);

    // Add valuation to business data
    businessData.valuation = valuation;

    console.log('🎉 Analysis completed with valuation:', {
      businessName: businessData.businessName,
      industry: businessData.businessType,
      estimatedValue: `$${valuation.estimatedValue.low.toLocaleString()} - $${valuation.estimatedValue.high.toLocaleString()}`,
      confidence: valuation.confidence
    });

    return NextResponse.json({
      success: true,
      businessData,
      metadata: {
        processed_at: new Date().toISOString(),
        sources_used: [
          placesData ? 'Places API' : null,
          webData ? 'Web Search' : null,
          'OCR',
          'Valuation Model'
        ].filter(Boolean),
        confidence: placesData && webData ? 'High' : 'Medium'
      }
    });

  } catch (error) {
    console.error('Process Business API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process business information',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}

function generateBusinessData(
  extractedText: ExtractedText,
  placesData: any = null,
  webData: any = null
): BusinessData {
  const businessName = placesData?.name || webData?.name || extractedText.businessNames[0] || 'Unknown Business';
  
  // Use the new industry categorization
  const businessType = categorizeBusinessIndustry(
    placesData?.name || webData?.businessType || 'Business',
    placesData?.types
  );

  // Generate comprehensive description
  const description = generateBusinessDescription(businessName, businessType, placesData, webData, extractedText);

  return {
    businessName,
    businessType,
    address: placesData?.formatted_address || webData?.address || extractedText.addresses[0] || 'Not Available',
    phone: placesData?.international_phone_number || webData?.phone || extractedText.phoneNumbers[0] || 'Not Available',
    website: placesData?.website || webData?.website || extractedText.websites[0] || 'Not Available',
    email: extractedText.emails[0] || 'Not Available',
    description,
    location: extractCityState(placesData?.formatted_address || webData?.address) || 'Location not specified',
    hours: formatBusinessHours(placesData?.opening_hours) || 'Not Available',
    rating: placesData?.rating || undefined,
    reviews: placesData?.user_ratings_total || undefined,
    ownerInfo: {
      name: 'Not Available',
      phone: 'Not Available',
      email: 'Not Available'
    }
  };
}

function extractValuationFactors(
  businessData: BusinessData,
  placesData: any,
  webData: any,
  extractedText: ExtractedText
): ValuationFactors {
  console.log('📊 Extracting valuation factors...');

  // Determine location quality from address and places data
  const locationQuality = assessLocationQuality(businessData.address, placesData);

  // Determine web presence quality
  const webPresenceQuality = assessWebPresenceQuality(webData, businessData.website);

  // Estimate years in business
  const yearsInBusiness = estimateYearsInBusiness(placesData, webData);

  // Assess equipment quality from image analysis
  const equipmentQuality = assessEquipmentFromImage(extractedText);

  // Determine business size
  const businessSize = assessBusinessSize(placesData, webData, extractedText);

  // Determine operating hours pattern
  const operatingHours = assessOperatingHours(placesData);

  return {
    businessType: businessData.businessType,
    location: businessData.location,
    rating: businessData.rating,
    reviewCount: businessData.reviews,
    yearsInBusiness,
    hasWebsite: businessData.website !== 'Not Available',
    webPresenceQuality,
    locationQuality,
    equipmentQuality,
    businessSize,
    operatingHours
  };
}

function assessLocationQuality(address: string, placesData: any): 'poor' | 'average' | 'good' | 'excellent' {
  // Basic assessment based on address and places data
  if (!address || address === 'Not Available') return 'poor';
  
  // Check for premium location indicators
  if (address.toLowerCase().includes('downtown') || 
      address.toLowerCase().includes('main st') ||
      address.toLowerCase().includes('center')) {
    return 'excellent';
  }
  
  // Use rating as a proxy for location quality
  if (placesData?.rating >= 4.5) return 'excellent';
  if (placesData?.rating >= 4.0) return 'good';
  if (placesData?.rating >= 3.5) return 'average';
  
  return 'average'; // Default assumption
}

function assessWebPresenceQuality(webData: any, website: string): 'poor' | 'average' | 'good' | 'excellent' {
  if (!webData || webData.isGenericFallback) return 'poor';
  if (website === 'Not Available') return 'poor';
  
  // Basic assessment - could be enhanced with actual website analysis
  if (webData.description && webData.description.length > 200) return 'good';
  if (website.includes('facebook') || website.includes('instagram')) return 'average';
  if (website.endsWith('.com') && !website.includes('facebook')) return 'good';
  
  return 'average';
}

function estimateYearsInBusiness(placesData: any, webData: any): number | undefined {
  // This is a placeholder - you could enhance this by:
  // - Checking domain registration age
  // - Looking for "established" or "since" in business descriptions
  // - Analyzing Google reviews date range
  
  if (placesData?.user_ratings_total > 100) return 8; // Lots of reviews suggests established business
  if (placesData?.user_ratings_total > 50) return 5;
  if (placesData?.user_ratings_total > 20) return 3;
  
  return undefined;
}

function assessEquipmentFromImage(extractedText: ExtractedText): 'basic' | 'average' | 'good' | 'excellent' {
  // Analyze extracted text for equipment/quality indicators
  const allText = extractedText.otherText.join(' ').toLowerCase();
  
  if (allText.includes('premium') || allText.includes('luxury') || allText.includes('professional')) return 'excellent';
  if (allText.includes('quality') || allText.includes('modern')) return 'good';
  
  return 'average'; // Default assumption
}

function assessBusinessSize(placesData: any, webData: any, extractedText: ExtractedText): 'micro' | 'small' | 'medium' | 'large' {
  // Use review count as a proxy for business size
  if (placesData?.user_ratings_total > 500) return 'large';
  if (placesData?.user_ratings_total > 100) return 'medium';
  if (placesData?.user_ratings_total > 20) return 'small';
  
  return 'micro';
}

function assessOperatingHours(placesData: any): 'limited' | 'standard' | 'extended' {
  if (!placesData?.opening_hours?.weekday_text) return 'standard';
  
  const hoursText = placesData.opening_hours.weekday_text.join(' ').toLowerCase();
  
  if (hoursText.includes('24') || hoursText.includes('midnight')) return 'extended';
  if (hoursText.includes('closed') && hoursText.split('closed').length > 3) return 'limited'; // Closed many days
  
  return 'standard';
}

function generateBusinessDescription(
  businessName: string,
  businessType: string,
  placesData: any,
  webData: any,
  extractedText: ExtractedText
): string {
  const location = extractCityState(placesData?.formatted_address || webData?.address) || 'the local area';
  
  let description = `${businessName} is a ${businessType.toLowerCase()}`;
  
  if (location !== 'the local area') {
    description += ` located in ${location}`;
  }
  
  description += '. ';

  // Add business-specific details based on industry
  if (businessType === 'Restaurants & Food') {
    description += `This established restaurant offers quality dining with fresh ingredients and excellent customer service. `;
  } else if (businessType === 'Retail') {
    description += `This retail establishment serves customers with a wide selection of quality products and personalized service. `;
  } else if (businessType === 'Health Care & Fitness') {
    description += `This healthcare business provides professional services with a focus on customer care and quality outcomes. `;
  } else if (businessType === 'Beauty & Personal Care') {
    description += `This beauty and personal care business offers professional services in a comfortable environment. `;
  } else if (businessType === 'Automotive & Boat') {
    description += `This automotive business provides reliable services with experienced technicians and quality parts. `;
  } else {
    description += `This established business serves the local community with quality services and professional expertise. `;
  }

  // Add reputation context
  if (placesData?.rating && placesData?.user_ratings_total) {
    const rating = placesData.rating;
    const reviews = placesData.user_ratings_total;
    description += `With a ${rating}-star rating based on ${reviews} customer reviews, `;
  }

  // Add operational status
  if (placesData?.business_status === 'OPERATIONAL') {
    description += `the business is currently operating and actively serving customers. `;
  }

  // Closing statement
  description += `${businessName} represents a solid business opportunity with established operations and a proven track record in the community.`;

  return description;
}

function extractCityState(address?: string): string | null {
  if (!address) return null;
  
  const parts = address.split(',').map(part => part.trim());
  if (parts.length >= 3) {
    const cityState = parts[parts.length - 2];
    return cityState;
  }
  
  return null;
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to process business information.' },
    { status: 405 }
  );
}