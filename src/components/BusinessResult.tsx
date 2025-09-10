// src/app/components/BusinessResults.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessResultsProps, ValuationFactor } from '@/lib/ui-types';
import { Download, Globe, MapPin, Phone, RotateCcw, Star } from 'lucide-react';
import Image from "next/image";
import React from 'react';

const BusinessResults: React.FC<BusinessResultsProps> = ({ businessData, onReset }) => {
  const { valuation } = businessData;

  const handleExport = (): void => {
    const listingData = {
      title: businessData.businessName,
      location: businessData.address,
      industry: businessData.businessType,
      description: businessData.description,
      contact: businessData.phone,
      website: businessData.website,
      rating: businessData.rating ? `${businessData.rating}/5 (${businessData.reviews} reviews)` : null,
      askingPrice: valuation ? `$${valuation.estimatedValue.low.toLocaleString()} - $${valuation.estimatedValue.high.toLocaleString()}` : 'Contact for pricing'
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(listingData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${businessData.businessName.replace(/[^a-z0-9]/gi, '_')}_listing.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen flex flex-col p-4 relative">
      <Image 
        src="/background.png" 
        alt="Background" 
        fill 
        className="object-cover -z-10" 
        priority
      />
      
      <div className="max-w-6xl mx-auto space-y-6 relative z-10 py-8">
        {/* Header Card */}
        <Card className="w-full bg-white/95 backdrop-blur-lg border-0 shadow-2xl py-6">
          <CardHeader className="text-center">
          
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              Business Analysis Complete
            </CardTitle>
            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto">
              Here is the comprehensive business information ready for listing
            </p>
          </CardHeader>
        </Card>

        {/* Business Name & Details Card */}
        <Card className="w-full bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
          <CardContent className="px-8 py-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {businessData.businessName}
              </h1>
              <div className="flex justify-center items-center flex-wrap gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{businessData.location}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 px-3 py-1.5 text-xs font-semibold"
                >
                  {businessData.businessType}
                </Badge>
                {businessData.rating && (
                  <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-yellow-700 text-sm">{businessData.rating}</span>
                    {businessData.reviews && (
                      <span className="text-yellow-600 text-xs">({businessData.reviews} reviews)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Location & Contact Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Location & Contact</span>
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                    <ul className="space-y-4">
                      <li>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Address</label>
                        <div className="flex items-start space-x-3 text-gray-700">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                          <span className="leading-relaxed text-sm">{businessData.address}</span>
                        </div>
                      </li>
                      
                      {businessData.phone !== 'Not Available' && (
                        <li>
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Phone</label>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-sm">{businessData.phone}</span>
                          </div>
                        </li>
                      )}
                      
                      {businessData.website !== 'Not Available' && (
                        <li>
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Website</label>
                          <div className="flex items-center space-x-3">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <a 
                              href={businessData.website.startsWith('http') ? businessData.website : `https://${businessData.website}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors font-medium hover:underline text-sm"
                            >
                              {businessData.website}
                            </a>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Business Description Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">✦</span>
                    </div>
                    <span>Business Description</span>
                  </h3>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {businessData.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* Valuation Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-600 font-bold text-sm">$</span>
                    </div>
                    <span>Possible Asking Price</span>
                  </h3>
                  
                  {valuation ? (
                    <div className="space-y-4">
                      <div className="text-center bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border-2 border-emerald-200 shadow-lg">
                        <div className="text-2xl font-bold text-emerald-600 mb-2">
                          ${valuation.estimatedValue.low.toLocaleString()} - ${valuation.estimatedValue.high.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          Mid-range estimate: ${valuation.estimatedValue.mid.toLocaleString()}
                        </div>
                        <Badge 
                          variant={valuation.confidence === 'high' ? 'default' : 'secondary'}
                          className={`${
                            valuation.confidence === 'high' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          } px-4 py-1 font-semibold uppercase tracking-wide text-xs`}
                        >
                          {valuation.confidence} Confidence
                        </Badge>
                      </div>
                      
                      {valuation.factors.length > 0 && (
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-3">Key Valuation Factors</label>
                          <ul className="space-y-2">
                            {valuation.factors.slice(0, 3).map((factor: ValuationFactor, index: number) => (
                              <li key={index} className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  factor.impact === 'positive' ? 'bg-emerald-500' : 
                                  factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                                }`} />
                                <span className="text-gray-700 leading-relaxed text-sm">{factor.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-gray-200">
                      <p className="text-gray-500 text-base mb-1">Valuation analysis not available</p>
                      <p className="text-gray-400 text-sm">Contact a business broker for professional appraisal</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                onClick={onReset} 
                variant="outline" 
                size="lg"
                className="px-6 py-4 text-base font-semibold hover:bg-[#ffd08b] hover:text-black hover:cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Analyze Another Business
              </Button>
              <Button 
                onClick={handleExport}
                className="px-6 py-4 text-base font-semibold bg-black hover:bg-gray-800 text-white hover:cursor-pointer"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Listing Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessResults;