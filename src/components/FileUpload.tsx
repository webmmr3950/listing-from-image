// src/app/components/FileUpload.tsx
'use client'

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Upload, Type, Image as ImageIcon } from 'lucide-react';
import React, { ChangeEvent, DragEvent, useCallback, useState } from 'react';
import Image from "next/image";

// Updated interface to include manual submit
interface FileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onProcess: () => void;
  onManualSubmit?: (businessName: string) => void;
  error?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  selectedFile,
  onFileSelect,
  onProcess,
  onManualSubmit,
  error
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [manualBusinessName, setManualBusinessName] = useState<string>('');
  const [inputMode, setInputMode] = useState<'image' | 'manual'>('image');

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
        setInputMode('image');
      }
    }
  }, [onFileSelect]);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
      setInputMode('image');
    }
  };

  const handleManualSubmit = (): void => {
    if (manualBusinessName.trim() && onManualSubmit) {
      onManualSubmit(manualBusinessName.trim());
    }
  };

  const switchToImageMode = (): void => {
    setInputMode('image');
    setManualBusinessName('');
  };

  const switchToManualMode = (): void => {
    setInputMode('manual');
    onFileSelect(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Image 
        src="/background.png" 
        alt="Background" 
        fill 
        className="object-cover -z-10" 
        priority
      />
      
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl relative z-10 py-8">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Business Listing Generator
          </CardTitle>
          <p className="text-gray-600">
            Upload a business image or enter the business name manually to generate a complete listing
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8 px-8">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Mode Selection Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                inputMode === 'image'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={switchToImageMode}
            >
              <ImageIcon className="w-4 h-4 inline mr-2" />
              Upload Image
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                inputMode === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={switchToManualMode}
            >
              <Type className="w-4 h-4 inline mr-2" />
              Enter Manually
            </button>
          </div>

          {inputMode === 'image' ? (
            <>
              {/* Image Upload Section */}
              <div
                className={`border-2 border-dashed rounded-2xl py-8 text-center transition-all duration-300 cursor-pointer transform ${
                  dragActive
                    ? "border-[#ffd08b] bg-[#ffd08b]/10 shadow-lg"
                    : selectedFile
                    ? "border-[#ffd08b] bg-[#ffd08b]/10 shadow-lg"
                    : "border-gray-300 hover:border-[#ffd08b] hover:bg-[#ffd08b]/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                />
                
                {selectedFile ? (
                  <div className="space-y-4">
                    <CheckCircle className="w-16 h-16 text-[#ffd08b] mx-auto" />
                    <div className="space-y-2">
                      <p className="text-xl font-semibold text-gray-800">Image Ready!</p>
                      <p className="text-lg text-gray-700">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      onClick={() => onFileSelect(null)}
                      variant="outline"
                      size="sm"
                      className="mt-4 border-2 border-[#ffd08b] text-[#ffd08b] hover:bg-[#ffd08b] hover:text-black"
                    >
                      Choose Different Image
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-6" />
                    <p className="text-xl font-semibold text-gray-700 mb-3">
                      Drop your business image here
                    </p>
                    <p className="text-gray-500 mb-3">
                      or click to browse (PNG, JPG, WEBP up to 5MB)
                    </p>
                    <p className="text-gray-600 italic">
                      * Please upload a clear image for better result! *
                    </p>
                  </label>
                )}
              </div>

              <Button
                onClick={onProcess}
                disabled={!selectedFile}
                className="w-full py-6 text-lg font-semibold bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-600 transition-all duration-300 transform hover:scale-[1.02]"
                size="lg"
              >
                Generate from Image
              </Button>
            </>
          ) : (
            <>
              {/* Manual Input Section */}
              <div className="space-y-4">
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Enter Business Name Manually
                  </h3>
                  <p className="text-gray-600">
                    Skip image processing and directly search for business information
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-name" className="text-sm font-medium text-gray-700">
                    Business Name
                  </Label>
                  <Input
                    id="business-name"
                    type="text"
                    placeholder="Enter business name (e.g., Pizza Leon, Starbucks Coffee)"
                    value={manualBusinessName}
                    onChange={(e) => setManualBusinessName(e.target.value)}
                    className="text-lg py-3 border-2 focus:border-[#ffd08b] focus:ring-[#ffd08b]/20"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && manualBusinessName.trim()) {
                        handleManualSubmit();
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the exact business name for best results
                  </p>
                </div>
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={!manualBusinessName.trim()}
                className="w-full py-6 text-lg font-semibold bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-600 transition-all duration-300 transform hover:scale-[1.02]"
                size="lg"
              >
                Generate from Business Name
              </Button>
            </>
          )}

          <Separator className="my-6" />

          <div className="text-center">
            <p className="text-sm text-gray-500">
              {inputMode === 'image' 
                ? "Having trouble with image quality? Try entering the business name manually above."
                : "Want to use an image instead? Switch to image upload above."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;