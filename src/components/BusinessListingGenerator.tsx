// src/app/components/BusinessListingGenerator.tsx
'use client';

import React, { useState } from 'react';
import FileUpload from './FileUpload';
import ProcessingView from './ProcessingView';
import BusinessNameConfirmation from './BusinessNameConfirmation';
import { BusinessData, CurrentStep, ProcessingStep } from '@/lib/ui-types';
import BusinessResults from './BusinessResult';

type ExtendedStep = CurrentStep | 'confirmation';

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

const BusinessListingGenerator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ExtendedStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [extractedTextData, setExtractedTextData] = useState<ExtractedTextData | null>(null);
  const [confirmedBusinessName, setConfirmedBusinessName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const processingSteps: ProcessingStep[] = [
    { id: 'extract', title: 'Extracting text from image', progress: 33 },
    { id: 'search', title: 'Searching Google Places & Web', progress: 66 },
    { id: 'generate', title: 'Generating business listing', progress: 100 }
  ];

  const handleFileSelect = (file: File | null): void => {
    setSelectedFile(file);
    setError(null);
  };

  const processImage = async (): Promise<void> => {
    if (!selectedFile) return;

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

  const continueProcessing = async (textData: ExtractedTextData, businessName: string): Promise<void> => {
    try {
      // Step 2: Process business information
      setProcessingProgress(66);
      const processResponse = await fetch('/api/process-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          extractedText: {
            ...textData,
            businessNames: [businessName, ...textData.businessNames.filter(name => name !== businessName)]
          }
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Failed to process business information');
      }

      const result = await processResponse.json();

      // Step 3: Complete
      setProcessingProgress(100);
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      setBusinessData(result.businessData);
      setCurrentStep('results');

    } catch (err) {
      console.error('Continue processing error:', err);
      throw err;
    }
  };

  const handleRetryFromConfirmation = (): void => {
    setCurrentStep('upload');
    setExtractedTextData(null);
    setConfirmedBusinessName('');
    setProcessingProgress(0);
  };

  const reset = (): void => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setBusinessData(null);
    setExtractedTextData(null);
    setConfirmedBusinessName('');
    setError(null);
    setProcessingProgress(0);
  };

  // Render based on current step
  if (currentStep === 'upload') {
    return (
      <FileUpload
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onProcess={processImage}
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

  if (currentStep === 'processing') {
    return (
      <ProcessingView
        progress={processingProgress}
        steps={processingSteps}
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