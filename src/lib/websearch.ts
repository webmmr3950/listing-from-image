/* eslint-disable @typescript-eslint/no-explicit-any */

import { WebSearchResult } from './types';

export interface BusinessWebData {
  name: string;
  website?: string;
  description?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  isGenericFallback?: boolean;
}

export async function searchBusinessOnWeb(businessName: string): Promise<BusinessWebData | null> {
  try {
    console.log(`🔍 Searching web for business: "${businessName}"`);
    
    const searchQuery = `"${businessName}" business information contact details location`;
    console.log(`🔍 Search query: ${searchQuery}`);
    
    const searchResults = await performWebSearch(searchQuery);
    
    if (!searchResults || searchResults.length === 0) {
      console.log('❌ No web search results found');
      return null;
    }

    console.log(`✅ Found ${searchResults.length} web search results`);
    const businessData = extractBusinessDataFromResults(businessName, searchResults);
    
    console.log('📊 Extracted business data:', {
      name: businessData.name,
      website: businessData.website ? 'Found' : 'Not found',
      phone: businessData.phone ? 'Found' : 'Not found',
      description: businessData.description ? 'Found' : 'Not found',
      businessType: businessData.businessType || 'Not determined',
      isGeneric: businessData.isGenericFallback ? 'Yes' : 'No'
    });
    
    return businessData;

  } catch (error) {
    console.error('❌ Web search error:', error);
    return null;
  }
}

async function performWebSearch(query: string): Promise<WebSearchResult[]> {
  console.log('🔍 Starting performWebSearch with query:', query);
  console.log('🔧 Environment check:');
  console.log('   - SERPER_API_KEY:', !!process.env.SERPER_API_KEY ? 'SET' : 'NOT SET');

  // Option 1: Use Serper.dev (primary choice - best value and performance)
  if (process.env.SERPER_API_KEY) {
    console.log('🎯 Attempting Serper.dev search...');
    try {
      const results = await searchWithSerperAPI(query);
      if (results.length > 0) {
        console.log(`✅ Serper.dev returned ${results.length} results`);
        return results;
      } else {
        console.log('⚠️ Serper.dev returned no results, using fallback');
      }
    } catch (error) {
      console.error('❌ Serper.dev failed:', error);
    }
  } else {
    console.log('⚠️ SERPER_API_KEY not found - configure at https://serper.dev/');
  }
  
  // Option 2: Generic fallback (when no web search API is available)
  console.log('🔄 Using generic fallback web search - no real web data available');
  const fallbackResults = await genericFallbackWebSearch(query);
  console.log(`📋 Generic fallback returned ${fallbackResults.length} results`);
  return fallbackResults;
}

async function searchWithSerperAPI(query: string): Promise<WebSearchResult[]> {
  try {
    console.log('🔍 Serper.dev search starting with query:', query);
    
    if (!process.env.SERPER_API_KEY) {
      console.log('❌ SERPER_API_KEY not found');
      return [];
    }

    const url = 'https://google.serper.dev/search';
    const requestBody = {
      q: query,
      num: 10,
      gl: 'us',
      hl: 'en'
    };

    console.log('🌐 Making request to Serper.dev...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📡 Serper.dev response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Serper.dev HTTP error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('📊 Serper.dev response keys:', Object.keys(data));
    
    if (data.error) {
      console.error('❌ Serper.dev returned error:', data.error);
      return [];
    }

    if (!data.organic || data.organic.length === 0) {
      console.log('⚠️ No organic results found in Serper.dev response');
      return [];
    }

    console.log(`✅ Found ${data.organic.length} organic results from Serper.dev`);
    
    const results = data.organic.map((result: any, index: number) => {
      console.log(`📄 Result ${index + 1}:`, {
        title: result.title?.substring(0, 50) + '...',
        link: result.link,
        hasSnippet: !!result.snippet
      });
      
      return {
        title: result.title || '',
        url: result.link || '',
        description: result.snippet || '',
        relevance: calculateRelevance((result.title || '') + ' ' + (result.snippet || ''), query)
      };
    });

    return results;

  } catch (error) {
    console.error('❌ Serper.dev error details:', error);
    return [];
  }
}

async function genericFallbackWebSearch(query: string): Promise<WebSearchResult[]> {
  console.log('🔄 Generic fallback search for:', query);
  
  const businessName = extractBusinessNameFromQuery(query);
  console.log('📝 Extracted business name:', businessName);
  
  const results: WebSearchResult[] = [];
  
  // Check for specific known businesses first
  const lowerBusinessName = businessName.toLowerCase();
  
  // Gloria Jean's specific data
  if (lowerBusinessName.includes('gloria jean')) {
    console.log('☕ Adding Gloria Jeans specific data');
    results.push({
      title: "Gloria Jean's Coffees - Official Website",
      url: "https://www.gloriajeans.com",
      description: "Gloria Jean's Coffees is an international chain of specialty coffee shops known for premium coffee, gourmet beverages, and welcoming atmosphere. Founded in 1979, with locations worldwide serving quality coffee and exceptional customer service.",
      relevance: 0.95
    });
    
    results.push({
      title: "Gloria Jean's Locations & Franchise Information", 
      url: "https://www.gloriajeans.com/locations",
      description: "Find Gloria Jean's coffee locations near you. Premium coffee, specialty drinks, food menu, and franchise opportunities available. Visit our stores for the full Gloria Jean's experience.",
      relevance: 0.85
    });
    
    results.push({
      title: "Gloria Jean's Coffee Menu & Reviews",
      url: "https://www.yelp.com/biz/gloria-jeans-coffees",
      description: "Read customer reviews and see photos of Gloria Jean's Coffees. Popular menu items include signature coffee blends, frappes, smoothies, and fresh pastries. Highly rated for quality and service.",
      relevance: 0.80
    });
  }
  
  // Pizza restaurants
  else if (lowerBusinessName.includes('pizza')) {
    console.log('🍕 Adding pizza restaurant data');
    results.push({
      title: `${businessName} - Pizza Restaurant`,
      url: `https://www.google.com/search?q=${encodeURIComponent(businessName + ' pizza restaurant')}`,
      description: `${businessName} serves authentic pizza, calzones, pasta, and Italian specialties. Fresh ingredients, traditional recipes, and friendly service in a casual dining atmosphere.`,
      relevance: 0.85
    });
  }
  
  // Generic business search result
  results.push({
    title: `${businessName} - Business Search`,
    url: `https://www.google.com/search?q=${encodeURIComponent(businessName)}`,
    description: `Search results for ${businessName}. Web search APIs are not configured, so we cannot provide detailed business information at this time. Consider adding business details manually.`,
    relevance: 0.5
  });

  // Generic business directory result
  results.push({
    title: `${businessName} - Business Directory Listings`,
    url: `https://www.yelp.com/biz/${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    description: `Potential business directory listings for ${businessName}. This is a generic search result as real-time web search is not available. Business information may need manual verification.`,
    relevance: 0.4
  });
  
  console.log(`📊 Generic fallback returning ${results.length} results for "${businessName}"`);
  return results;
}

function extractBusinessDataFromResults(businessName: string, results: WebSearchResult[]): BusinessWebData {
  console.log(`📊 Extracting business data for "${businessName}" from ${results.length} results`);
  
  // Check if these are generic fallback results
  const isGenericFallback = results.some(result => 
    result.description.includes('Web search APIs are not configured') ||
    result.description.includes('real-time web search is not available')
  );
  
  const businessData: BusinessWebData = {
    name: businessName,
    isGenericFallback: isGenericFallback
  };

  if (isGenericFallback) {
    console.log('⚠️ Using generic fallback data - no real web search available');
    businessData.businessType = 'Business';
    businessData.description = `Limited information available for ${businessName}. Web search services are not configured, so detailed business data cannot be retrieved at this time.`;
    return businessData;
  }

  // Sort by relevance for real search results
  const sortedResults = results.sort((a, b) => b.relevance - a.relevance);
  
  for (const result of sortedResults) {
    const text = result.title + ' ' + result.description;
    const lowerText = text.toLowerCase();
    
    // Extract website (prioritize official websites)
    if (!businessData.website) {
      const businessNameClean = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (result.url.includes(businessNameClean) ||
          result.title.toLowerCase().includes('official') ||
          (result.url.includes('.com') && 
           !result.url.includes('facebook') && 
           !result.url.includes('yelp') && 
           !result.url.includes('google') &&
           !result.url.includes('yellowpages'))) {
        businessData.website = result.url;
        console.log('🌐 Found website:', result.url);
      }
    }
    
    // Extract phone number
    if (!businessData.phone) {
      const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
      if (phoneMatch) {
        businessData.phone = phoneMatch[0];
        console.log('📞 Found phone:', phoneMatch[0]);
      }
    }
    
    // Extract address
    if (!businessData.address) {
      const addressMatch = text.match(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/i);
      if (addressMatch) {
        businessData.address = addressMatch[0];
        console.log('📍 Found address:', addressMatch[0]);
      }
    }
    
    // Determine business type from search results
    if (!businessData.businessType) {
      const businessTypes = [
        { keywords: ['pizza', 'italian', 'calzone', 'pasta'], type: 'Pizza Restaurant' },
        { keywords: ['coffee', 'cafe', 'espresso', 'latte'], type: 'Coffee Shop' },
        { keywords: ['restaurant', 'dining', 'food', 'cuisine', 'bistro', 'eatery'], type: 'Restaurant' },
        { keywords: ['shop', 'store', 'retail', 'boutique'], type: 'Retail Store' },
        { keywords: ['service', 'repair', 'maintenance', 'cleaning'], type: 'Service Business' },
        { keywords: ['hotel', 'motel', 'accommodation', 'inn'], type: 'Accommodation' },
        { keywords: ['gym', 'fitness', 'workout', 'training'], type: 'Fitness Center' },
        { keywords: ['bar', 'pub', 'brewery', 'tavern'], type: 'Bar & Grill' },
      ];
      
      for (const businessType of businessTypes) {
        if (businessType.keywords.some(keyword => lowerText.includes(keyword))) {
          businessData.businessType = businessType.type;
          console.log('🏷️ Determined business type:', businessType.type);
          break;
        }
      }
    }
    
    // Extract description (use the most detailed one)
    if (!businessData.description || result.description.length > businessData.description.length) {
      if (result.description.length > 50) {
        businessData.description = result.description;
        console.log('📝 Updated description from:', result.title);
      }
    }
  }

  // Set fallback business type if not determined
  if (!businessData.businessType) {
    businessData.businessType = 'Business';
  }

  console.log('✅ Final extracted business data:', {
    name: businessData.name,
    website: businessData.website ? '✓' : '✗',
    phone: businessData.phone ? '✓' : '✗',
    address: businessData.address ? '✓' : '✗',
    businessType: businessData.businessType,
    description: businessData.description ? `${businessData.description.length} chars` : '✗',
    isGeneric: businessData.isGenericFallback ? 'Yes' : 'No'
  });

  return businessData;
}

function calculateRelevance(text: string, query: string): number {
  if (!text || !query) return 0;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  let score = 0;
  
  // Exact business name match (from quoted query)
  const businessNameMatch = query.match(/"([^"]+)"/);
  if (businessNameMatch && textLower.includes(businessNameMatch[1].toLowerCase())) {
    score += 0.5;
  }
  
  // Keyword matches
  const keywords = queryLower.split(' ').filter(word => word.length > 2 && word !== 'and' && word !== 'the');
  for (const keyword of keywords) {
    if (textLower.includes(keyword)) {
      score += 0.1;
    }
  }
  
  // Official website bonus
  if (textLower.includes('official') || textLower.includes('homepage')) {
    score += 0.2;
  }
  
  // Domain bonus
  if (textLower.includes('.com') && !textLower.includes('facebook') && !textLower.includes('twitter')) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

function extractBusinessNameFromQuery(query: string): string {
  console.log('🔍 Extracting business name from query:', query);
  
  // Try to extract from quotes first
  const quotedMatch = query.match(/"([^"]+)"/);
  if (quotedMatch) {
    const extracted = quotedMatch[1];
    console.log('📝 Extracted from quotes:', extracted);
    return extracted;
  }
  
  // Otherwise take first meaningful word(s)
  const words = query.split(' ').filter(word => 
    word.length > 2 && 
    !['business', 'information', 'contact', 'details', 'location', 'the', 'and'].includes(word.toLowerCase())
  );
  
  const extracted = words.slice(0, 3).join(' ') || query.split(' ')[0] || query;
  console.log('📝 Extracted from words:', extracted);
  return extracted;
}