// src/app/api/extract-text/route.ts

import { extractTextWithEnhancedVision } from '@/lib/vision';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Check if the required environment variables are set
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return NextResponse.json(
        { error: 'Google Cloud Vision API not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are supported.' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    console.log(`Processing image: ${file.name} (${file.size} bytes, ${file.type})`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text using Enhanced Vision (Google Vision + Smart Post-Processing)
    const extractedData = await extractTextWithEnhancedVision(buffer);

    console.log('Enhanced Vision extraction completed:', {
      businessNames: extractedData.businessNames.length,
      addresses: extractedData.addresses.length,
      phoneNumbers: extractedData.phoneNumbers.length,
      websites: extractedData.websites.length,
      emails: extractedData.emails.length,
      confidence: extractedData.confidence
    });

    return NextResponse.json({
      success: true,
      text: extractedData,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type,
        processed_at: new Date().toISOString(),
        ocr_method: 'enhanced_vision' // Indicate which OCR method was used
      }
    });

  } catch (error) {
    console.error('Extract Text API Error:', error);
    
    let errorMessage = 'Failed to extract text from image';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Vision')) {
        errorMessage = 'Google Vision API error. Please check your credentials and quota.';
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Invalid API credentials. Please check your configuration.';
        statusCode = 401;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: statusCode }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload an image.' },
    { status: 405 }
  );
}