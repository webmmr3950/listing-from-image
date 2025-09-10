/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/lib/enhanced-vision.ts
import vision from '@google-cloud/vision';
import { ExtractedText } from './types';

// Initialize client with proper error handling
function createVisionClient() {
  // Check if we're in production/Vercel
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log('🏗️ Initializing Vision client for production...');
    
    // Verify all required environment variables exist
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing required Google Cloud environment variables');
    }
    
    console.log(`   - Project ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
    console.log(`   - Client Email: ${process.env.GOOGLE_CLIENT_EMAIL}`);
    console.log(`   - Private Key: ${process.env.GOOGLE_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_PRIVATE_KEY.length + ')' : 'NOT SET'}`);
    
    return new vision.ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        type: 'service_account'
      }
    });
  } else {
    console.log('🏗️ Initializing Vision client for local development...');
    
    // For local development, use the credentials file
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set for local development');
    }
    
    console.log(`   - Credentials file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    
    return new vision.ImageAnnotatorClient();
  }
}

const client = createVisionClient();

export async function extractTextWithEnhancedVision(imageBuffer: Buffer): Promise<ExtractedText> {
  try {
    console.log('🔍 STARTING ENHANCED VISION OCR');
    console.log('='.repeat(80));
    console.log(`📷 Image buffer size: ${imageBuffer.length} bytes`);
    
    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    });
    
    const detections = result.textAnnotations || [];
    console.log(`📊 Google Vision returned ${detections.length} text detections`);
    
    if (detections.length === 0) {
      console.log('❌ No text detected in image');
      throw new Error('No text detected in image');
    }

    // Log the full text detection (first element)
    const fullText = detections[0]?.description || '';
    console.log('\n📄 RAW OCR FULL TEXT:');
    console.log('-'.repeat(40));
    console.log(`"${fullText}"`);
    console.log('-'.repeat(40));
    
    // Log individual word detections with positions and confidence
    const wordDetections = detections.slice(1);
    console.log(`\n📋 INDIVIDUAL WORD DETECTIONS (${wordDetections.length} words):`);
    wordDetections.forEach((detection, index) => {
      const word = detection.description;
      const confidence = detection.confidence || 0;
      const vertices = detection.boundingPoly?.vertices || [];
      const hasPosition = vertices.length > 0;
      
      console.log(`  ${(index + 1).toString().padStart(2, ' ')}. "${word}" (confidence: ${confidence.toFixed(3)}, position: ${hasPosition ? 'YES' : 'NO'})`);
    });
    
    // Enhanced business name extraction with context awareness
    console.log('\n🏢 STARTING BUSINESS NAME EXTRACTION');
    console.log('='.repeat(50));
    const businessNames = extractBusinessNamesWithContext(fullText);
    
    console.log('\n🔍 EXTRACTING OTHER INFORMATION');
    console.log('-'.repeat(30));
    const addresses = extractAddresses(fullText);
    const phoneNumbers = extractPhoneNumbers(fullText);
    const websites = extractWebsites(fullText);
    const emails = extractEmails(fullText);
    
    console.log(`📍 Addresses found: ${addresses.length}`);
    addresses.forEach((addr, i) => console.log(`  ${i + 1}. "${addr}"`));
    
    console.log(`📞 Phone numbers found: ${phoneNumbers.length}`);
    phoneNumbers.forEach((phone, i) => console.log(`  ${i + 1}. "${phone}"`));
    
    console.log(`🌐 Websites found: ${websites.length}`);
    websites.forEach((site, i) => console.log(`  ${i + 1}. "${site}"`));
    
    console.log(`📧 Emails found: ${emails.length}`);
    emails.forEach((email, i) => console.log(`  ${i + 1}. "${email}"`));
    
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

    console.log('\n📊 FINAL ENHANCED EXTRACTION RESULTS:');
    console.log('='.repeat(50));
    console.log('✅ Business names for Places/Web Search:', result_data.businessNames);
    console.log('✅ Confidence levels:', result_data.confidence);
    console.log('✅ Other text lines:', otherText.length);
    console.log('='.repeat(80));

    return result_data;

  } catch (error) {
    console.error('❌ Enhanced Vision Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

function extractBusinessNamesWithContext(text: string): string[] {
  console.log('\n🏢 BUSINESS NAME EXTRACTION - DETAILED BREAKDOWN:');
  console.log('-'.repeat(60));
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  console.log(`📝 Split text into ${lines.length} lines:`);
  lines.forEach((line, i) => {
    console.log(`  Line ${(i + 1).toString().padStart(2, ' ')}: "${line}"`);
  });
  
  // Clean and filter lines
  console.log('\n🧹 PREPROCESSING LINES:');
  const cleanedLines = preprocessLines(lines);
  console.log(`✅ After filtering: ${cleanedLines.length} meaningful lines:`);
  cleanedLines.forEach((line, i) => {
    console.log(`  Clean ${(i + 1).toString().padStart(2, ' ')}: "${line}"`);
  });
  
  // Extract candidates using multiple strategies
  const candidates = [];
  
  console.log('\n🎯 STRATEGY 1: CONTEXT-AWARE COMBINATIONS');
  const contextCandidates = extractWithBusinessContext(cleanedLines);
  console.log(`   Found ${contextCandidates.length} context candidates:`);
  contextCandidates.forEach((name, i) => {
    console.log(`     Context ${(i + 1).toString().padStart(2, ' ')}: "${name}"`);
  });
  candidates.push(...contextCandidates.map(name => ({ name, strategy: 'context', score: 0 })));
  
  console.log('\n📍 STRATEGY 2: POSITIONAL WEIGHTING');
  const positionalCandidates = extractWithPositionalWeighting(cleanedLines);
  console.log(`   Found ${positionalCandidates.length} positional candidates:`);
  positionalCandidates.forEach((name, i) => {
    console.log(`     Position ${(i + 1).toString().padStart(2, ' ')}: "${name}"`);
  });
  candidates.push(...positionalCandidates.map(name => ({ name, strategy: 'positional', score: 0 })));
  
  console.log('\n🔤 STRATEGY 3: PATTERN MATCHING');
  const patternCandidates = extractWithPatternMatching(cleanedLines);
  console.log(`   Found ${patternCandidates.length} pattern candidates:`);
  patternCandidates.forEach((name, i) => {
    console.log(`     Pattern ${(i + 1).toString().padStart(2, ' ')}: "${name}"`);
  });
  candidates.push(...patternCandidates.map(name => ({ name, strategy: 'pattern', score: 0 })));
  
  console.log(`\n📊 TOTAL CANDIDATES BEFORE SCORING: ${candidates.length}`);
  
  // Score all candidates
  console.log('\n🏆 SCORING ALL CANDIDATES:');
  candidates.forEach((candidate, i) => {
    const firstWordIndex = cleanedLines.indexOf(candidate.name.split(' ')[0]);
    candidate.score = scoreBusinessName(candidate.name, firstWordIndex);
    console.log(`  ${(i + 1).toString().padStart(2, ' ')}. "${candidate.name}" (${candidate.strategy}) → Score: ${candidate.score.toFixed(2)}`);
  });
  
  // Remove duplicates and sort by score
  console.log('\n🔄 REMOVING DUPLICATES:');
  const uniqueCandidates = removeSimilarCandidates(candidates);
  console.log(`   Unique candidates after deduplication: ${uniqueCandidates.length}`);
  uniqueCandidates.forEach((candidate, i) => {
    console.log(`     Unique ${(i + 1).toString().padStart(2, ' ')}: "${candidate.name}" (score: ${candidate.score.toFixed(2)})`);
  });
  
  console.log('\n📈 SORTING BY SCORE (HIGHEST FIRST):');
  uniqueCandidates.sort((a, b) => b.score - a.score);
  uniqueCandidates.forEach((candidate, i) => {
    console.log(`     Rank ${(i + 1).toString().padStart(2, ' ')}: "${candidate.name}" → ${candidate.score.toFixed(2)} points`);
  });
  
  const finalNames = uniqueCandidates.slice(0, 3).map(c => c.name);
  console.log('\n🎯 TOP 3 BUSINESS NAMES FOR API SEARCHES:');
  finalNames.forEach((name, i) => {
    console.log(`     ${i + 1}. "${name}" ← Will be used for Places API & Web Search`);
  });
  
  return finalNames;
}

function preprocessLines(lines: string[]): string[] {
  console.log('   Preprocessing each line:');
  const result = lines
    .map(line => line.trim())
    .filter((line, i) => {
      const lower = line.toLowerCase();
      const reasons = [];
      
      // Check each filter condition
      if (line.length <= 1) reasons.push('too short');
      if (['our', 'menu', 'hours', 'open', 'closed', 'welcome', 'visit', 'call', 'phone', 'email'].includes(lower)) reasons.push('common word');
      if (lower.startsWith('www')) reasons.push('website');
      if (lower.startsWith('http')) reasons.push('url');
      if (lower.includes('@')) reasons.push('email');
      if (/^\d+$/.test(line)) reasons.push('just numbers');
      if (line === '&') reasons.push('just ampersand');
      if (line === '-') reasons.push('just dash');
      if (!/[a-zA-Z]/.test(line)) reasons.push('no letters');
      
      const isKept = reasons.length === 0;
      console.log(`     Line ${(i + 1).toString().padStart(2, ' ')}: "${line}" → ${isKept ? 'KEEP' : 'FILTER (' + reasons.join(', ') + ')'}`);
      
      return isKept;
    });
  
  return result;
}

function extractWithBusinessContext(lines: string[]): string[] {
  const candidates = [];
  
  // Look for business-indicating word patterns
  const businessIndicators = [
    { words: ['coffee'], weight: 1.0 },
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
  
  console.log('     Checking combinations for business keywords...');
  
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
          console.log(`     ✓ Context match: "${combined}" (contains: ${indicator.words.join(' + ')})`);
          break;
        }
      }
    }
  }
  
  return candidates;
}

function extractWithPositionalWeighting(lines: string[]): string[] {
  const candidates = [];
  
  console.log('     Extracting based on position (earlier = more important)...');
  
  // Earlier lines are more likely to be business names
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    
    // Single words (if they look substantial)
    if (line.length >= 4 && line.length <= 15) {
      candidates.push(line);
      console.log(`     ✓ Single word: "${line}" (position ${i + 1})`);
    }
    
    // Two-word combinations
    if (i < lines.length - 1) {
      const combined = `${lines[i]} ${lines[i + 1]}`;
      if (combined.length <= 30) {
        candidates.push(combined);
        console.log(`     ✓ Two words: "${combined}" (positions ${i + 1}-${i + 2})`);
      }
    }
    
    // Three-word combinations  
    if (i < lines.length - 2) {
      const combined = `${lines[i]} ${lines[i + 1]} ${lines[i + 2]}`;
      if (combined.length <= 40) {
        candidates.push(combined);
        console.log(`     ✓ Three words: "${combined}" (positions ${i + 1}-${i + 3})`);
      }
    }
  }
  
  return candidates;
}

function extractWithPatternMatching(lines: string[]): string[] {
  const candidates = [];
  
  // Look for common business name patterns
  const patterns = [
    { regex: /^[A-Z][a-z]+ [A-Z][a-z]+$/, name: 'Proper case two words' },
    { regex: /^[A-Z]+ [A-Z]+$/, name: 'All caps two words' },
    { regex: /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/, name: 'Three proper case words' },
    { regex: /^[A-Z]+ [A-Z]+ [A-Z]+$/, name: 'Three all caps words' }
  ];
  
  console.log('     Checking text patterns...');
  
  for (let i = 0; i < lines.length - 1; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, lines.length); j++) {
      const combined = lines.slice(i, j).join(' ');
      
      // Check against patterns
      for (const pattern of patterns) {
        if (pattern.regex.test(combined) && combined.length <= 35) {
          candidates.push(combined);
          console.log(`     ✓ Pattern match: "${combined}" (${pattern.name})`);
          break;
        }
      }
    }
  }
  
  return candidates;
}

function scoreBusinessName(name: string, position: number): number {
  let score = 0;
  const scoringDetails = [];
  
  // Position score (earlier = better, max 10 points)
  const positionScore = Math.max(0, 10 - position);
  score += positionScore;
  scoringDetails.push(`position: +${positionScore.toFixed(1)}`);
  
  // Length score (optimal business name length, max 5 points)
  const words = name.split(' ');
  let lengthScore = 0;
  if (words.length === 2) lengthScore = 5; // Two words ideal
  else if (words.length === 3) lengthScore = 4; // Three words good
  else if (words.length === 1 && name.length > 4) lengthScore = 3; // Single substantial word
  score += lengthScore;
  scoringDetails.push(`length: +${lengthScore}`);
  
  // Format score (max 5 points)
  let formatScore = 0;
  if (/^[A-Z]/.test(name)) {
    formatScore += 2; // Starts with capital
    scoringDetails.push('capital start: +2');
  }
  if (/^[A-Z\s&\-'\.]+$/.test(name)) {
    formatScore += 3; // All caps (common in signage)
    scoringDetails.push('all caps: +3');
  }
  score += formatScore;
  
  // Business keyword bonus (max 8 points)
  const lowerName = name.toLowerCase();
  const businessKeywords = [
    { word: 'coffee', points: 7 },
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
  
  let keywordScore = 0;
  for (const keyword of businessKeywords) {
    if (lowerName.includes(keyword.word)) {
      keywordScore = keyword.points;
      scoringDetails.push(`keyword "${keyword.word}": +${keyword.points}`);
      break;
    }
  }
  score += keywordScore;
  
  // Completeness bonus (max 3 points)
  let completenessScore = 0;
  if (name.length >= 8 && name.length <= 25) {
    completenessScore = 3;
    scoringDetails.push('good length: +3');
  }
  score += completenessScore;
  
  // Penalize very long or very short names
  if (name.length < 4) {
    score -= 3;
    scoringDetails.push('too short: -3');
  }
  if (name.length > 40) {
    score -= 5;
    scoringDetails.push('too long: -5');
  }
  
  const finalScore = Math.max(0, score);
  console.log(`       Scoring "${name}": ${finalScore.toFixed(2)} (${scoringDetails.join(', ')})`);
  
  return finalScore;
}

function removeSimilarCandidates(candidates: any[]): any[] {
  const unique: any[] = [];
  
  for (const candidate of candidates) {
    const isDuplicate = unique.some(existing => {
      // Check if one is completely contained in the other
      const existingText = existing.name.toLowerCase();
      const candidateText = candidate.name.toLowerCase();
      
      const isContained = existingText.includes(candidateText) || 
                         candidateText.includes(existingText) ||
                         existingText === candidateText;
      
      if (isContained) {
        console.log(`       Filtering duplicate: "${candidate.name}" (similar to "${existing.name}")`);
      }
      
      return isContained;
    });
    
    if (!isDuplicate) {
      unique.push(candidate);
      console.log(`       Keeping unique: "${candidate.name}"`);
    }
  }
  
  return unique;
}

function calculateSmartConfidence(detections: any[], businessNames: string[]): ExtractedText['confidence'] {
  console.log('\n🎯 CALCULATING CONFIDENCE:');
  let confidence = 0.5; // Base confidence
  const confidenceDetails = ['base: 0.5'];
  
  // Detection quality
  if (detections.length > 5) {
    confidence += 0.1;
    confidenceDetails.push('>5 detections: +0.1');
  }
  if (detections.length > 10) {
    confidence += 0.1;
    confidenceDetails.push('>10 detections: +0.1');
  }
  
  // Business names found
  if (businessNames.length > 0) {
    confidence += 0.2;
    confidenceDetails.push('business names found: +0.2');
  }
  if (businessNames.length > 1) {
    confidence += 0.1;
    confidenceDetails.push('multiple names: +0.1');
  }
  
  // Text quality
  const fullText = detections[0]?.description || '';
  const words = fullText.split(/\s+/).filter((w: string | any[]) => w.length > 0);
  if (words.length >= 5) {
    confidence += 0.1;
    confidenceDetails.push('≥5 words: +0.1');
  }
  
  const finalConfidence = Math.min(0.95, confidence);
  console.log(`   Final confidence: ${finalConfidence.toFixed(3)} (${confidenceDetails.join(', ')})`);
  
  const getLevel = (score: number): 'High' | 'Medium' | 'Low' => {
  if (score > 0.7) return 'High';
  if (score > 0.5) return 'Medium';
  return 'Low';
};

  const result = {
    businessName: getLevel(finalConfidence),
    address: getLevel(finalConfidence * 0.8),
    phone: getLevel(finalConfidence * 0.7)
  };
  
  console.log(`   Confidence levels: ${JSON.stringify(result)}`);
  return result;
}

function extractAddresses(text: string): string[] {
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct)/gi;
  const matches = text.match(addressRegex) || [];
  console.log(`   Address extraction: ${matches.length} found`);
  return matches;
}

function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const matches = text.match(phoneRegex) || [];
  console.log(`   Phone extraction: ${matches.length} found`);
  return matches;
}

function extractWebsites(text: string): string[] {
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/g;
  const matches = text.match(websiteRegex) || [];
  console.log(`   Website extraction: ${matches.length} found`);
  return matches;
}

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  console.log(`   Email extraction: ${matches.length} found`);
  return matches;
}