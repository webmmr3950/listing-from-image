// src/app/components/ProcessingView.tsx
import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProcessingStep, ProcessingViewProps } from '@/lib/ui-types';
import Image from "next/image";

const ProcessingView: React.FC<ProcessingViewProps> = ({ progress, steps }) => {
  const currentStepIndex = steps.findIndex(step => step.progress > progress) - 1;
  const activeStep: ProcessingStep = steps[Math.max(0, currentStepIndex)] || steps[steps.length - 1];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Image 
        src="/background.png" 
        alt="Background" 
        fill 
        className="object-cover -z-10" 
        priority
      />
      
      {/* Subtle overlay for better readability */}
      <div className="absolute inset-0 bg-black/10 -z-5"></div>

      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-lg border-0 shadow-2xl z-10">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#ffd08b]/20 rounded-full flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-black animate-spin" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 mb-2">
            Processing Your Image
          </CardTitle>
          <p className="text-sm text-gray-600">
            This may take a few moments...
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-8">
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800">
              {activeStep?.title}
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-3 bg-gray-200 rounded-full overflow-hidden" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#ffd08b] to-black rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 font-medium">
                {progress}% Complete
              </p>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i <= currentStepIndex ? 'bg-[#ffd08b]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step: ProcessingStep, index: number) => (
              <div key={step.id} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-shrink-0">
                  {progress >= step.progress ? (
                    <CheckCircle className="w-5 h-5 text-[#ffd08b]" />
                  ) : progress >= (steps[index - 1]?.progress || 0) ? (
                    <Loader2 className="w-5 h-5 text-black animate-spin" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                <p className={`text-sm transition-all duration-300 ${
                  progress >= step.progress 
                    ? 'text-gray-800 font-semibold' 
                    : progress >= (steps[index - 1]?.progress || 0)
                    ? 'text-black font-semibold'
                    : 'text-gray-500 font-medium'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingView;