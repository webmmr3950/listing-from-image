// src/app/lib/places.ts
import { PlacesResult } from './types';

export async function searchBusiness(businessName: string, address?: string): Promise<PlacesResult | null> {
  try {
    const query = address ? `${businessName} ${address}` : businessName;
    
    console.log('Searching Places API with query:', query);

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key is not configured');
      return null;
    }

    console.log('Using direct HTTP request for Places API with query:', query);

    // Step 1: Text Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error('Search request failed:', searchResponse.status, searchResponse.statusText);
      return null;
    }

    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK') {
      console.log('Places API returned status:', searchData.status);
      if (searchData.error_message) {
        console.error('Places API error:', searchData.error_message);
      }
      return null;
    }

    if (!searchData.results || searchData.results.length === 0) {
      console.log('No results found in Places API');
      return null;
    }

    const bestMatch = searchData.results[0];
    const placeId = bestMatch.place_id;

    console.log('Found place via HTTP:', bestMatch.name, 'Place ID:', placeId);

    // Step 2: Get Place Details
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

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    
    if (!detailsResponse.ok) {
      console.error('Details request failed:', detailsResponse.status, detailsResponse.statusText);
      // Return basic info if details fail
      return {
        place_id: placeId,
        name: bestMatch.name,
        formatted_address: bestMatch.formatted_address,
        geometry: bestMatch.geometry,
        types: bestMatch.types,
        rating: bestMatch.rating,
        user_ratings_total: bestMatch.user_ratings_total,
      } as PlacesResult;
    }

    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK') {
      console.error('Place details returned status:', detailsData.status);
      if (detailsData.error_message) {
        console.error('Place details error:', detailsData.error_message);
      }
      // Return basic info if details fail
      return bestMatch as PlacesResult;
    }

    console.log('Successfully retrieved place details via HTTP');
    return detailsData.result as PlacesResult;

  } catch (error) {
    console.error('HTTP Places API Error:', error);
    return null;
  }
}

export function formatBusinessHours(openingHours?: { weekday_text: string[] }): string {
  if (!openingHours || !openingHours.weekday_text) {
    return 'Not Available';
  }
  
  return openingHours.weekday_text.join(', ');
}

export function formatBusinessTypes(types?: string[]): string {
  if (!types || types.length === 0) {
    return 'Not Available';
  }

  // Convert types to readable format
  const readableTypes = types
    .filter(type => !type.includes('establishment') && !type.includes('point_of_interest'))
    .map(type => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .slice(0, 3);

  return readableTypes.join(', ') || 'Not Available';
}