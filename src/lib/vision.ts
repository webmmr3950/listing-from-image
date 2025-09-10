/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/lib/enhanced-vision.ts
import vision from '@google-cloud/vision';
import { ExtractedText } from './types';

const client = new vision.ImageAnnotatorClient();

export async function extractTextWithEnhancedVision(imageBuffer: Buffer): Promise<ExtractedText> {
  try {
    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    });
    
    console.log('🔍 Enhanced Vision OCR Results:');
    console.log('='.repeat(50));
    
    const detections = result.textAnnotations || [];
    
    if (detections.length === 0) {
      console.log('❌ No text detected in image');
      throw new Error('No text detected in image');
    }

    const fullText = detections[0]?.description || '';
    const wordDetections = detections.slice(1);
    
    console.log('📄 Raw OCR Text:', JSON.stringify(fullText));
    console.log('📊 Word detections:', wordDetections.length);
    
    // Enhanced business name extraction with context awareness
    const businessNames = extractBusinessNamesWithContext(fullText);
    const addresses = extractAddresses(fullText);
    const phoneNumbers = extractPhoneNumbers(fullText);
    const websites = extractWebsites(fullText);
    const emails = extractEmails(fullText);
    const otherText = fullText.split('\n').filter(line => 
      line.trim().length > 0 && 
      !phoneNumbers.some(phone => line.includes(phone)) &&
      !websites.some(website => line.includes(website)) &&
      !emails.some(email => line.includes(email))
    );

    const confidence = calculateSmartConfidence(detections, businessNames);

    const result_data = {
      businessNames,
      addresses,
      phoneNumbers,
      websites,
      emails,
      otherText,
      confidence
    };

    console.log('📊 Enhanced Extraction Results:');
    console.log('Business names:', result_data.businessNames);
    console.log('Confidence levels:', result_data.confidence);
    console.log('='.repeat(50));

    return result_data;

  } catch (error) {
    console.error('❌ Enhanced Vision Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

function extractBusinessNamesWithContext(text: string): string[] {
  console.log('🏢 Enhanced Business Name Extraction:');
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  console.log('Raw lines:', lines);
  
  // Clean and filter lines
  const cleanedLines = preprocessLines(lines);
  console.log('Cleaned lines:', cleanedLines);
  
  // Extract candidates using multiple strategies
  const candidates = [];
  
  // Strategy 1: Context-aware combinations
  const contextCandidates = extractWithBusinessContext(cleanedLines);
  candidates.push(...contextCandidates.map(name => ({ name, strategy: 'context', score: 0 })));
  
  // Strategy 2: Positional importance (earlier = more important)
  const positionalCandidates = extractWithPositionalWeighting(cleanedLines);
  candidates.push(...positionalCandidates.map(name => ({ name, strategy: 'positional', score: 0 })));
  
  // Strategy 3: Pattern-based extraction
  const patternCandidates = extractWithPatternMatching(cleanedLines);
  candidates.push(...patternCandidates.map(name => ({ name, strategy: 'pattern', score: 0 })));
  
  // Score all candidates
  candidates.forEach(candidate => {
    candidate.score = scoreBusinessName(candidate.name, cleanedLines.indexOf(candidate.name.split(' ')[0]));
  });
  
  console.log('📊 All candidates with scores:');
  candidates.forEach(c => {
    console.log(`  "${c.name}" (${c.strategy}): ${c.score.toFixed(2)}`);
  });
  
  // Remove duplicates and sort by score
  const uniqueCandidates = removeSimilarCandidates(candidates);
  uniqueCandidates.sort((a, b) => b.score - a.score);
  
  const finalNames = uniqueCandidates.slice(0, 3).map(c => c.name);
  console.log('🎯 Final business names:', finalNames);
  
  return finalNames;
}

function preprocessLines(lines: string[]): string[] {
  return lines
    .map(line => line.trim())
    .filter(line => {
      const lower = line.toLowerCase();
      // Filter out obvious non-business text
      return line.length > 1 && 
             !['our', 'menu', 'hours', 'open', 'closed', 'welcome', 'visit', 'call', 'phone', 'email'].includes(lower) &&
             !lower.startsWith('www') &&
             !lower.startsWith('http') &&
             !lower.includes('@') &&
             !/^\d+$/.test(line) && // Just numbers
             line !== '&' && // Just ampersand
             line !== '-' && // Just dash
             /[a-zA-Z]/.test(line); // Contains at least one letter
    });
}

function extractWithBusinessContext(lines: string[]): string[] {
  const candidates = [];
  
  // Look for business-indicating word patterns
  const businessIndicators = [
    { words: ['food', 'park'], weight: 1.0 },
    { words: ['coffee', 'shop'], weight: 1.0 },
    { words: ['restaurant'], weight: 0.8 },
    { words: ['market'], weight: 0.7 },
    { words: ['center'], weight: 0.7 },
    { words: ['plaza'], weight: 0.7 },
    { words: ['cafe'], weight: 0.8 },
    { words: ['grill'], weight: 0.8 },
    { words: ['bar'], weight: 0.8 }
  ];
  
  // Check all possible combinations for business indicators
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j <= Math.min(i + 4, lines.length); j++) {
      const combined = lines.slice(i, j).join(' ');
      const lowerCombined = combined.toLowerCase();
      
      // Check if this combination contains business indicators
      for (const indicator of businessIndicators) {
        const hasAllWords = indicator.words.every(word => lowerCombined.includes(word));
        if (hasAllWords && combined.length < 50) {
          candidates.push(combined);
          console.log(`  ✓ Context match: "${combined}" (${indicator.words.join(' + ')})`);
          break;
        }
      }
    }
  }
  
  return candidates;
}

function extractWithPositionalWeighting(lines: string[]): string[] {
  const candidates = [];
  
  // Earlier lines are more likely to be business names
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    
    // Single words (if they look substantial)
    if (line.length >= 4 && line.length <= 15) {
      candidates.push(line);
    }
    
    // Two-word combinations
    if (i < lines.length - 1) {
      const combined = `${lines[i]} ${lines[i + 1]}`;
      if (combined.length <= 30) {
        candidates.push(combined);
      }
    }
    
    // Three-word combinations  
    if (i < lines.length - 2) {
      const combined = `${lines[i]} ${lines[i + 1]} ${lines[i + 2]}`;
      if (combined.length <= 40) {
        candidates.push(combined);
      }
    }
  }
  
  return candidates;
}

function extractWithPatternMatching(lines: string[]): string[] {
  const candidates = [];
  
  // Look for common business name patterns
  const patterns = [
    /^[A-Z][a-z]+ [A-Z][a-z]+$/, // Proper case two words
    /^[A-Z]+ [A-Z]+$/, // All caps two words  
    /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/, // Three proper case words
    /^[A-Z]+ [A-Z]+ [A-Z]+$/ // Three all caps words
  ];
  
  for (let i = 0; i < lines.length - 1; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, lines.length); j++) {
      const combined = lines.slice(i, j).join(' ');
      
      // Check against patterns
      for (const pattern of patterns) {
        if (pattern.test(combined) && combined.length <= 35) {
          candidates.push(combined);
          console.log(`  ✓ Pattern match: "${combined}"`);
          break;
        }
      }
    }
  }
  
  return candidates;
}

function scoreBusinessName(name: string, position: number): number {
  let score = 0;
  
  // Position score (earlier = better, max 10 points)
  score += Math.max(0, 10 - position);
  
  // Length score (optimal business name length, max 5 points)
  const words = name.split(' ');
  if (words.length === 2) score += 5; // Two words ideal
  else if (words.length === 3) score += 4; // Three words good
  else if (words.length === 1 && name.length > 4) score += 3; // Single substantial word
  
  // Format score (max 5 points)
  if (/^[A-Z]/.test(name)) score += 2; // Starts with capital
  if (/^[A-Z\s&\-'\.]+$/.test(name)) score += 3; // All caps (common in signage)
  
  // Business keyword bonus (max 8 points)
  const lowerName = name.toLowerCase();
  const businessKeywords = [
    { word: 'food park', points: 8 },
    { word: 'coffee shop', points: 7 },
    { word: 'restaurant', points: 6 },
    { word: 'market', points: 5 },
    { word: 'center', points: 4 },
    { word: 'plaza', points: 4 },
    { word: 'cafe', points: 5 },
    { word: 'grill', points: 5 },
    { word: 'bar', points: 4 }
  ];
  
  for (const keyword of businessKeywords) {
    if (lowerName.includes(keyword.word)) {
      score += keyword.points;
      break;
    }
  }
  
  // Completeness bonus (max 3 points)
  if (name.length >= 8 && name.length <= 25) score += 3; // Good length
  
  // Penalize very long or very short names
  if (name.length < 4) score -= 3;
  if (name.length > 40) score -= 5;
  
  return Math.max(0, score);
}

function removeSimilarCandidates(candidates: any[]): any[] {
  const unique: any[] = [];
  
  for (const candidate of candidates) {
    const isDuplicate = unique.some(existing => {
      
      // Check if one is completely contained in the other
      const existingText = existing.name.toLowerCase();
      const candidateText = candidate.name.toLowerCase();
      
      return existingText.includes(candidateText) || 
             candidateText.includes(existingText) ||
             existingText === candidateText;
    });
    
    if (!isDuplicate) {
      unique.push(candidate);
    }
  }
  
  return unique;
}

function calculateSmartConfidence(detections: any[], businessNames: string[]): ExtractedText['confidence'] {
  let confidence = 0.5; // Base confidence
  
  // Detection quality
  if (detections.length > 5) confidence += 0.1;
  if (detections.length > 10) confidence += 0.1;
  
  // Business names found
  if (businessNames.length > 0) confidence += 0.2;
  if (businessNames.length > 1) confidence += 0.1;
  
  // Text quality
  const fullText = detections[0]?.description || '';
  const words = fullText.split(/\s+/).filter((w: string | any[]) => w.length > 0);
  if (words.length >= 5) confidence += 0.1;
  
  const finalConfidence = Math.min(0.95, confidence);
  
  const getLevel = (score: number) => {
    if (score > 0.7) return 'High';
    if (score > 0.5) return 'Medium';
    return 'Low';
  };

  return {
    businessName: getLevel(finalConfidence),
    address: getLevel(finalConfidence * 0.8),
    phone: getLevel(finalConfidence * 0.7)
  };
}

function extractAddresses(text: string): string[] {
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct)/gi;
  return text.match(addressRegex) || [];
}

function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  return text.match(phoneRegex) || [];
}

function extractWebsites(text: string): string[] {
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/g;
  return text.match(websiteRegex) || [];
}

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}