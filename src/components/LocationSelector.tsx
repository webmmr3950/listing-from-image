// src/app/components/LocationSelector.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, Star } from 'lucide-react';
import React from 'react';

interface LocationOption {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface LocationSelectorProps {
  options: LocationOption[];
  businessName: string;
  onSelect: (option: LocationOption) => void;
  onDismiss: () => void;
  onRetry: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  options,
  businessName,
  onSelect,
  onDismiss,
  onRetry
}) => {
  const formatBusinessTypes = (types?: string[]): string => {
    if (!types || types.length === 0) return 'Business';
    
    const readableTypes = types
      .filter(type => !type.includes('establishment') && !type.includes('point_of_interest'))
      .map(type => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .slice(0, 2);
    
    return readableTypes.join(', ') || 'Business';
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'OPERATIONAL': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED_TEMPORARILY': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CLOSED_PERMANENTLY': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status?: string): string => {
    switch (status) {
      case 'OPERATIONAL': return 'Open';
      case 'CLOSED_TEMPORARILY': return 'Temporarily Closed';
      case 'CLOSED_PERMANENTLY': return 'Permanently Closed';
      default: return 'Status Unknown';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-4xl bg-white shadow-lg">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center mb-2">
            <MapPin className="w-6 h-6 text-blue-600 mr-2" />
            <CardTitle className="text-2xl font-bold text-gray-900">
              Multiple Locations Found
            </CardTitle>
          </div>
          <p className="text-gray-600">
            We found <strong>{options.length}</strong> businesses named <strong className='italic'>{businessName}</strong>. 
            Please select the correct location:
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {options.map((option, index) => (
              <Card 
                key={option.place_id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-blue-300"
                onClick={() => onSelect(option)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      {/* Business Name and Number */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          Option {index + 1}
                        </Badge>
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {option.name}
                        </h3>
                      </div>
                      
                      {/* Address */}
                      <div className="flex items-start gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {option.formatted_address}
                        </p>
                      </div>
                      
                      {/* Rating, Reviews, and Business Type */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {option.rating && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {option.rating} ({option.user_ratings_total || 0} reviews)
                          </Badge>
                        )}
                        
                        <Badge variant="outline">
                          {formatBusinessTypes(option.types)}
                        </Badge>
                        
                        {option.business_status && (
                          <Badge 
                            className={getStatusColor(option.business_status)}
                            variant="outline"
                          >
                            {getStatusText(option.business_status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Select Button */}
                    <Button 
                      className="ml-4 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(option);
                      }}
                    >
                      Select This Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
            {/* <Button 
              variant="outline" 
              onClick={onDismiss}
              className="flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              None of these are correct
            </Button>
             */}
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              None of these are correct, Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSelector;