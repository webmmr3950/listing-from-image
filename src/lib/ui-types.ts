// src/app/lib/ui-types.ts

export interface ProcessingStep {
  id: string;
  title: string;
  progress: number;
}

export interface ValuationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ValuationResult {
  estimatedValue: {
    low: number;
    mid: number;
    high: number;
  };
  confidence: 'low' | 'medium' | 'high';
  factors: ValuationFactor[];
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
  valuation?: ValuationResult;
  ownerInfo: {
    name: string;
    phone: string;
    email: string;
  };
}

export type CurrentStep = 'upload' | 'processing' | 'results';

export interface FileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onProcess: () => void;
  error: string | null;
}

export interface ProcessingViewProps {
  progress: number;
  steps: ProcessingStep[];
}

export interface BusinessResultsProps {
  businessData: BusinessData;
  onReset: () => void;
}

// New interface for business name confirmation
export interface BusinessNameConfirmationProps {
  extractedNames: string[];
  confidence: 'High' | 'Medium' | 'Low';
  onConfirm: (businessName: string) => void;
  onRetry: () => void;
}