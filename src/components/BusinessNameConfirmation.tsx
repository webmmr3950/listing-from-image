// src/app/components/BusinessNameConfirmation.tsx
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Edit3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BusinessNameConfirmationProps {
  extractedNames: string[];
  confidence: 'High' | 'Medium' | 'Low';
  onConfirm: (businessName: string) => void;
  onRetry: () => void;
}

const BusinessNameConfirmation: React.FC<BusinessNameConfirmationProps> = ({
  extractedNames,
  confidence,
  onConfirm,
  onRetry
}) => {
  const [selectedName, setSelectedName] = useState<string>(extractedNames[0] || '');
  const [customName, setCustomName] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);

  const handleConfirm = () => {
    const finalName = useCustom ? customName.trim() : selectedName;
    if (finalName) {
      onConfirm(finalName);
    }
  };

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'High': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F59E0B' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 0h20v20H0zM20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
            Please Confirm Business Name
          </CardTitle>
          <p className="text-gray-600 text-lg leading-relaxed">
            We extracted text from your image, but want to make sure we have the correct business name
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-8">
          <Alert className={`border-2 ${getConfidenceColor(confidence)}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              Text extraction confidence: <span className="font-bold">{confidence}</span>
              {confidence === 'Low' && ' - Please double-check the business name below'}
            </AlertDescription>
          </Alert>

          {extractedNames.length > 0 && (
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Detected Business Names
              </label>
              <div className="space-y-2">
                {extractedNames.map((name, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`name-${index}`}
                      name="businessName"
                      value={name}
                      checked={selectedName === name && !useCustom}
                      onChange={(e) => {
                        setSelectedName(e.target.value);
                        setUseCustom(false);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label 
                      htmlFor={`name-${index}`} 
                      className="text-lg font-medium text-gray-800 cursor-pointer flex-1 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="custom-name"
                name="businessName"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="custom-name" className="text-lg font-medium text-gray-800 cursor-pointer">
                Enter the correct business name
              </label>
            </div>
            
            {useCustom && (
              <div className="ml-7 space-y-2">
                <Input
                  type="text"
                  placeholder="Type the business name here..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="text-lg p-4 border-2 border-blue-300 focus:border-blue-500"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1 py-3 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <Edit3 className="w-5 h-5 mr-2" />
              Try Different Image
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={!selectedName && !customName.trim()}
              className="flex-1 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-300 shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirm & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessNameConfirmation;