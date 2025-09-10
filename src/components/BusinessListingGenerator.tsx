/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/components/BusinessListingGenerator.tsx
'use client';

import React, { useState } from 'react';
import FileUpload from './FileUpload';
import ProcessingView from './ProcessingView';
import BusinessNameConfirmation from './BusinessNameConfirmation';
import { BusinessData, CurrentStep, ProcessingStep } from '@/lib/ui-types';
import BusinessResults from './BusinessResult';
import LocationSelector from './LocationSelector';

type ExtendedStep = CurrentStep | 'confirmation' | 'location-selection';

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

interface ExtractedTextData {
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

interface ProcessBusinessResponse {
  success: boolean;
  businessData: BusinessData;
  hasMultipleLocations: boolean;
  locationOptions?: LocationOption[];
  metadata: {
    processed_at: string;
    sources_used: string[];
    confidence: string;
    multipleLocationsCount?: number;
  };
}

const BusinessListingGenerator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ExtendedStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [extractedTextData, setExtractedTextData] = useState<ExtractedTextData | null>(null);
  const [confirmedBusinessName, setConfirmedBusinessName] = useState<string>('');
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);

  const processingSteps: ProcessingStep[] = [
    { id: 'extract', title: 'Extracting text from image', progress: 33 },
    { id: 'search', title: 'Searching Google Places & Web', progress: 66 },
    { id: 'generate', title: 'Generating business listing', progress: 100 }
  ];

  const manualProcessingSteps: ProcessingStep[] = [
    { id: 'search', title: 'Searching Google Places & Web', progress: 50 },
    { id: 'generate', title: 'Generating business listing', progress: 100 }
  ];

  const handleFileSelect = (file: File | null): void => {
    setSelectedFile(file);
    setError(null);
    setIsManualInput(false);
  };

  const handleManualSubmit = async (businessName: string): Promise<void> => {
    console.log('Manual business name submitted:', businessName);
    
    setIsManualInput(true);
    setCurrentStep('processing');
    setProcessingProgress(10);
    setError(null);

    try {
      // Create mock extracted text data for manual input
      const mockExtractedText: ExtractedTextData = {
        businessNames: [businessName],
        addresses: [],
        phoneNumbers: [],
        websites: [],
        emails: [],
        otherText: [],
        confidence: {
          businessName: 'High',
          address: 'Low',
          phone: 'Low'
        }
      };

      setExtractedTextData(mockExtractedText);
      setConfirmedBusinessName(businessName);

      // Start processing immediately (no confirmation needed for manual input)
      await continueProcessing(mockExtractedText, businessName);

    } catch (err) {
      console.error('Manual processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCurrentStep('upload');
      setProcessingProgress(0);
    }
  };

  const processImage = async (): Promise<void> => {
    if (!selectedFile) return;

    setIsManualInput(false);
    setCurrentStep('processing');
    setProcessingProgress(0);
    setError(null);

    try {
      // Step 1: Extract text from image
      setProcessingProgress(33);
      const formData = new FormData();
      formData.append('image', selectedFile);

      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to extract text from image');
      }

      const extractedData = await extractResponse.json();
      setExtractedTextData(extractedData.text);

      // Check if we need confirmation based on confidence or business name quality
      const needsConfirmation = shouldRequestConfirmation(extractedData.text);
      
      if (needsConfirmation) {
        setCurrentStep('confirmation');
        setProcessingProgress(0);
        return;
      }

      // Continue with processing if no confirmation needed
      await continueProcessing(extractedData.text, extractedData.text.businessNames[0]);

    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCurrentStep('upload');
      setProcessingProgress(0);
    }
  };

  const shouldRequestConfirmation = (textData: ExtractedTextData): boolean => {
    // Request confirmation if:
    // 1. Business name confidence is low
    // 2. No business names found
    // 3. Business names are too generic or unclear
    
    if (textData.confidence.businessName === 'Low') {
      return true;
    }
    
    if (!textData.businessNames || textData.businessNames.length === 0) {
      return true;
    }
    
    // Check if business names are too generic
    const genericNames = ['business', 'company', 'store', 'shop'];
    const firstBusinessName = textData.businessNames[0]?.toLowerCase() || '';
    
    if (genericNames.some(generic => firstBusinessName.includes(generic)) && firstBusinessName.length < 10) {
      return true;
    }
    
    return false;
  };

  const handleBusinessNameConfirmation = async (businessName: string): Promise<void> => {
    if (!extractedTextData) return;

    setConfirmedBusinessName(businessName);
    setCurrentStep('processing');
    
    try {
      // Update the extracted text data with confirmed business name
      const updatedTextData = {
        ...extractedTextData,
        businessNames: [businessName, ...extractedTextData.businessNames.filter(name => name !== businessName)]
      };

      await continueProcessing(updatedTextData, businessName);
    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCurrentStep('confirmation');
    }
  };

  const continueProcessing = async (
    textData: ExtractedTextData, 
    businessName: string, 
    selectedLocation?: LocationOption
  ): Promise<void> => {
    try {
      // Step 2: Process business information
      const targetProgress = isManualInput ? 50 : 66;
      setProcessingProgress(targetProgress);
      
      const requestBody: any = {
        extractedText: {
          ...textData,
          businessNames: [businessName, ...textData.businessNames.filter(name => name !== businessName)]
        }
      };

      // Include selected location if provided
      if (selectedLocation) {
        requestBody.selectedLocation = selectedLocation;
      }

      const processResponse = await fetch('/api/process-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Failed to process business information');
      }

      const result: ProcessBusinessResponse = await processResponse.json();

      // Check if multiple locations were found and we haven't selected one yet
      if (result.hasMultipleLocations && !selectedLocation && result.locationOptions) {
        console.log(`Found ${result.locationOptions.length} location options`);
        setLocationOptions(result.locationOptions);
        setBusinessData(result.businessData); // Store fallback business data
        setCurrentStep('location-selection');
        setProcessingProgress(0);
        return;
      }

      // Step 3: Complete processing
      setProcessingProgress(100);
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      setBusinessData(result.businessData);
      setCurrentStep('results');

    } catch (err) {
      console.error('Continue processing error:', err);
      throw err;
    }
  };

  const handleLocationSelection = async (selectedLocation: LocationOption): Promise<void> => {
    if (!extractedTextData) return;

    console.log('User selected location:', selectedLocation.name, selectedLocation.formatted_address);
    
    setCurrentStep('processing');
    // Start at 50% for manual input, 66% for image input since we already did earlier processing
    setProcessingProgress(isManualInput ? 50 : 66); 
    
    try {
      const businessName = confirmedBusinessName || extractedTextData.businessNames[0];
      await continueProcessing(extractedTextData, businessName, selectedLocation);
    } catch (err) {
      console.error('Location selection processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCurrentStep('location-selection');
    }
  };

  const handleLocationDismiss = (): void => {
    // User dismissed location selector, proceed with the fallback business data
    console.log('User dismissed location selector, using fallback data');
    if (businessData) {
      setCurrentStep('results');
    } else {
      setError('No business data available. Please try again.');
      setCurrentStep('upload');
    }
  };

  const handleRetryFromConfirmation = (): void => {
    setCurrentStep('upload');
    setExtractedTextData(null);
    setConfirmedBusinessName('');
    setProcessingProgress(0);
    setLocationOptions([]);
    setIsManualInput(false);
  };

  const handleRetryFromLocationSelection = (): void => {
    setCurrentStep('upload');
    setExtractedTextData(null);
    setConfirmedBusinessName('');
    setLocationOptions([]);
    setBusinessData(null);
    setProcessingProgress(0);
    setIsManualInput(false);
  };

  const reset = (): void => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setBusinessData(null);
    setExtractedTextData(null);
    setConfirmedBusinessName('');
    setLocationOptions([]);
    setError(null);
    setProcessingProgress(0);
    setIsManualInput(false);
  };

  // Render based on current step
  if (currentStep === 'upload') {
    return (
      <FileUpload
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onProcess={processImage}
        onManualSubmit={handleManualSubmit}
        error={error}
      />
    );
  }

  if (currentStep === 'confirmation' && extractedTextData) {
    return (
      <BusinessNameConfirmation
        extractedNames={extractedTextData.businessNames}
        confidence={extractedTextData.confidence.businessName}
        onConfirm={handleBusinessNameConfirmation}
        onRetry={handleRetryFromConfirmation}
      />
    );
  }

  if (currentStep === 'location-selection' && locationOptions.length > 0) {
    return (
      <LocationSelector
        options={locationOptions}
        businessName={confirmedBusinessName || extractedTextData?.businessNames[0] || 'Unknown Business'}
        onSelect={handleLocationSelection}
        onDismiss={handleLocationDismiss}
        onRetry={handleRetryFromLocationSelection}
      />
    );
  }

  if (currentStep === 'processing') {
    return (
      <ProcessingView
        progress={processingProgress}
        steps={isManualInput ? manualProcessingSteps : processingSteps}
      />
    );
  }

  if (currentStep === 'results' && businessData) {
    return (
      <BusinessResults
        businessData={businessData}
        onReset={reset}
      />
    );
  }

  return null;
};

export default BusinessListingGenerator;