/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/lib/places.ts
import { PlacesResult } from './types';

export async function searchBusiness(businessName: string, address?: string): Promise<PlacesResult | null> {
  try {
    console.log('🗺️ STARTING GOOGLE PLACES API SEARCH');
    console.log('='.repeat(60));
    console.log(`📝 Input business name: "${businessName}"`);
    console.log(`📍 Input address: ${address ? `"${address}"` : 'Not provided'}`);
    
    const query = address ? `${businessName} ${address}` : businessName;
    console.log(`🔍 Final search query: "${query}"`);

    // Check API key
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('❌ Google Places API key is not configured');
      return null;
    }
    console.log('✅ Google Places API key is configured');

    // Step 1: Text Search
    console.log('\n📡 STEP 1: PERFORMING TEXT SEARCH');
    console.log('-'.repeat(40));
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    console.log(`🌐 Search URL: ${searchUrl.replace(process.env.GOOGLE_PLACES_API_KEY, '[API_KEY]')}`);
    
    console.log('📤 Making text search request...');
    const searchResponse = await fetch(searchUrl);
    console.log(`📥 Search response status: ${searchResponse.status} ${searchResponse.statusText}`);
    
    if (!searchResponse.ok) {
      console.error('❌ Search request failed:', searchResponse.status, searchResponse.statusText);
      return null;
    }

    const searchData = await searchResponse.json();
    console.log('📊 Search response keys:', Object.keys(searchData));
    console.log(`📋 Search status: "${searchData.status}"`);

    if (searchData.status !== 'OK') {
      console.log('⚠️ Places API returned non-OK status:', searchData.status);
      if (searchData.error_message) {
        console.error('❌ Places API error message:', searchData.error_message);
      }
      return null;
    }

    if (!searchData.results || searchData.results.length === 0) {
      console.log('❌ No results found in Places API response');
      return null;
    }

    console.log(`✅ Found ${searchData.results.length} search results`);
    
    // Log all results for debugging
    searchData.results.forEach((result: any, index: number) => {
      console.log(`  Result ${index + 1}:`);
      console.log(`    Name: "${result.name}"`);
      console.log(`    Address: "${result.formatted_address || 'N/A'}"`);
      console.log(`    Types: [${(result.types || []).join(', ')}]`);
      console.log(`    Rating: ${result.rating || 'N/A'} (${result.user_ratings_total || 0} reviews)`);
      console.log(`    Place ID: ${result.place_id}`);
      console.log(`    Business Status: ${result.business_status || 'N/A'}`);
    });

    const bestMatch = searchData.results[0];
    const placeId = bestMatch.place_id;
    console.log(`\n🎯 Selected best match: "${bestMatch.name}"`);
    console.log(`📍 Address: "${bestMatch.formatted_address || 'N/A'}"`);
    console.log(`🆔 Place ID: ${placeId}`);

    // Step 2: Get Place Details
    console.log('\n📡 STEP 2: FETCHING DETAILED PLACE INFORMATION');
    console.log('-'.repeat(40));
    const fields = [
      'name',
      'formatted_address',
      'international_phone_number',
      'website',
      'business_status',
      'opening_hours',
      'rating',
      'user_ratings_total',
      'price_level',
      'types',
      'geometry'
    ].join(',');
    console.log(`📝 Requested fields: ${fields}`);

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    console.log(`🌐 Details URL: ${detailsUrl.replace(process.env.GOOGLE_PLACES_API_KEY, '[API_KEY]')}`);
    
    console.log('📤 Making place details request...');
    const detailsResponse = await fetch(detailsUrl);
    console.log(`📥 Details response status: ${detailsResponse.status} ${detailsResponse.statusText}`);
    
    if (!detailsResponse.ok) {
      console.error('⚠️ Details request failed:', detailsResponse.status, detailsResponse.statusText);
      console.log('🔄 Returning basic info from search results as fallback');
      
      const fallbackResult = {
        place_id: placeId,
        name: bestMatch.name,
        formatted_address: bestMatch.formatted_address,
        geometry: bestMatch.geometry,
        types: bestMatch.types,
        rating: bestMatch.rating,
        user_ratings_total: bestMatch.user_ratings_total,
      } as PlacesResult;
      
      console.log('📊 Fallback result:', fallbackResult);
      return fallbackResult;
    }

    const detailsData = await detailsResponse.json();
    console.log('📊 Details response keys:', Object.keys(detailsData));
    console.log(`📋 Details status: "${detailsData.status}"`);

    if (detailsData.status !== 'OK') {
      console.error('⚠️ Place details returned non-OK status:', detailsData.status);
      if (detailsData.error_message) {
        console.error('❌ Place details error message:', detailsData.error_message);
      }
      console.log('🔄 Returning basic search result as fallback');
      return bestMatch as PlacesResult;
    }

    const result = detailsData.result as PlacesResult;
    
    console.log('\n📊 DETAILED PLACE INFORMATION RETRIEVED:');
    console.log('-'.repeat(40));
    console.log(`🏢 Business Name: "${result.name}"`);
    console.log(`📍 Full Address: "${result.formatted_address || 'N/A'}"`);
    console.log(`📞 Phone: "${result.international_phone_number || 'N/A'}"`);
    console.log(`🌐 Website: "${result.website || 'N/A'}"`);
    console.log(`📊 Rating: ${result.rating || 'N/A'} stars (${result.user_ratings_total || 0} reviews)`);
    console.log(`💰 Price Level: ${result.price_level !== undefined ? '$'.repeat(result.price_level + 1) : 'N/A'}`);
    console.log(`🏷️ Business Types: [${(result.types || []).join(', ')}]`);
    console.log(`📍 Coordinates: ${result.geometry?.location ? `${result.geometry.location.lat}, ${result.geometry.location.lng}` : 'N/A'}`);
    console.log(`🚪 Business Status: ${result.business_status || 'N/A'}`);
    
    if (result.opening_hours?.weekday_text) {
      console.log('🕒 Hours:');
      result.opening_hours.weekday_text.forEach(hours => {
        console.log(`    ${hours}`);
      });
    } else {
      console.log('🕒 Hours: Not available');
    }

    console.log('\n✅ PLACES API SEARCH COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    return result;

  } catch (error) {
    console.error('❌ PLACES API ERROR:', error);
    console.log('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return null;
  }
}

export function formatBusinessHours(openingHours?: { weekday_text: string[] }): string {
  console.log('🕒 Formatting business hours...');
  
  if (!openingHours || !openingHours.weekday_text) {
    console.log('   No opening hours data available');
    return 'Not Available';
  }
  
  console.log(`   Found ${openingHours.weekday_text.length} days of hours data`);
  openingHours.weekday_text.forEach((hours, index) => {
    console.log(`   Day ${index + 1}: ${hours}`);
  });
  
  const formatted = openingHours.weekday_text.join(', ');
  console.log(`   Formatted hours: "${formatted.substring(0, 100)}${formatted.length > 100 ? '...' : ''}"`);
  
  return formatted;
}

export function formatBusinessTypes(types?: string[]): string {
  console.log('🏷️ Formatting business types...');
  
  if (!types || types.length === 0) {
    console.log('   No business types available');
    return 'Not Available';
  }

  console.log(`   Input types: [${types.join(', ')}]`);
  
  // Filter out generic types
  const filteredTypes = types.filter(type => 
    !type.includes('establishment') && !type.includes('point_of_interest')
  );
  console.log(`   After filtering generic types: [${filteredTypes.join(', ')}]`);

  // Convert types to readable format
  const readableTypes = filteredTypes
    .map(type => {
      const readable = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`     "${type}" → "${readable}"`);
      return readable;
    })
    .slice(0, 3);

  console.log(`   Final readable types (max 3): [${readableTypes.join(', ')}]`);
  
  const result = readableTypes.join(', ') || 'Not Available';
  console.log(`   Formatted result: "${result}"`);
  
  return result;
}

// Add this to your places.ts file
export async function getMultiplePlacesOptions(businessName: string, address?: string): Promise<PlacesResult[]> {
  try {
    console.log('🗺️ SEARCHING FOR MULTIPLE PLACES OPTIONS');
    console.log('='.repeat(60));
    
    const query = address ? `${businessName} ${address}` : businessName;
    console.log(`🔍 Search query: "${query}"`);

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('❌ Google Places API key not configured');
      return [];
    }

    // Text Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error('❌ Search request failed:', searchResponse.status);
      return [];
    }

    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' || !searchData.results || searchData.results.length === 0) {
      console.log('❌ No results found');
      return [];
    }

    console.log(`✅ Found ${searchData.results.length} potential locations`);

    // Return up to 5 options
    const options = searchData.results.slice(0, 10);
    
    // Get basic details for each option (we'll get full details only when user selects)
    const processedOptions = options.map((result: any) => ({
      place_id: result.place_id,
      name: result.name,
      formatted_address: result.formatted_address,
      geometry: result.geometry,
      types: result.types,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      business_status: result.business_status
    }));

    console.log('📍 Location options:');
    processedOptions.forEach((option: { name: any; formatted_address: any; }, index: number) => {
      console.log(`  ${index + 1}. ${option.name} - ${option.formatted_address}`);
    });

    return processedOptions;

  } catch (error) {
    console.error('❌ Error getting multiple places options:', error);
    return [];
  }
}