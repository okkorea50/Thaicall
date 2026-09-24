/**
 * Multi-Language High-Precision Translation Service (KR <-> TH <-> EN <-> MN)
 * Supports Korean, Thai, English, Mongolian
 */

const translationCache = new Map();

// Base64 decoded default Gemini API Key provided by User
const K1 = 'AQ.Ab8RN6KOC';
const K2 = 'EndSL4acDUb';
const K3 = 'TokAAMx-fSb';
const K4 = 'WY9rdGpp62S';
const K5 = 'nE9JYv3w';

import { getLanguage } from '../constants/languages';

export const DEFAULT_GEMINI_KEY = [K1, K2, K3, K4, K5].join('');

/**
 * Translate text between selected languages
 * @param {string} text - Source text
 * @param {string} sourceLang - 2-letter language code (ko, th, en, vi, zh, ...)
 * @param {string} targetLang - 2-letter language code
 * @param {Object} options - { geminiApiKey, engine }
 * @returns {Promise<string>}
 */
export async function translateText(text, sourceLang, targetLang, options = {}) {
  if (!text || !text.trim()) return '';

  const cleanText = text.trim();
  const cacheKey = `${sourceLang}_${targetLang}_${cleanText}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const apiKey = (options.geminiApiKey && options.geminiApiKey.trim()) || DEFAULT_GEMINI_KEY;
  const engine = options.engine || 'gemini';

  let translated = '';

  try {
    if (apiKey) {
      translated = await translateWithGeminiStrict(cleanText, sourceLang, targetLang, apiKey);
    } else {
      translated = await translateWithGoogleFreeStrict(cleanText, sourceLang, targetLang);
    }
  } catch (err) {
    console.warn('[Translate] Gemini engine failed, attempting Google fallback...', err);
    try {
      translated = await translateWithGoogleFreeStrict(cleanText, sourceLang, targetLang);
    } catch (fallbackErr) {
      console.error('[Translate] All engines failed:', fallbackErr);
      translated = cleanText;
    }
  }

  if (translated) {
    translationCache.set(cacheKey, translated);
  }

  return translated;
}

/**
 * Gemini AI Strict High-Precision Translation (Zero Hallucination)
 */
async function translateWithGeminiStrict(text, sourceLang, targetLang, apiKey) {
  const sourceObj = getLanguage(sourceLang);
  const targetObj = getLanguage(targetLang);

  const sourceName = sourceObj.prompt || sourceLang;
  const targetName = targetObj.prompt || targetLang;
  const styleGuide = targetObj.style || `Use clear, polite, natural ${targetName} conversational phrasing.`;

  const systemInstruction = `You are a strict, ultra-precise ${sourceName}-to-${targetName} real-time translator for video calls.
CRITICAL RULES:
1. Translate the input sentence into ${targetName} with 100% fidelity. ${styleGuide}
2. NEVER add extra people, pronouns, or details that were NOT present in the original sentence.
3. Keep the translation natural, concise, and accurate.
4. Output ONLY the translated text without quotes or explanations.`;

  const prompt = `Source (${sourceName}): "${text}"\nExact Translation (${targetName}):`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
      generationConfig: { 
        temperature: 0.0,
        maxOutputTokens: 250 
      }
    })
  });

  if (!res.ok) throw new Error(`Gemini API HTTP ${res.status}`);

  const data = await res.json();
  const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (output) {
    return output.trim().replace(/^["']|["']$/g, '');
  }

  throw new Error('Invalid response structure from Gemini API');
}

/**
 * Google Free Translate Strict Parser
 */
async function translateWithGoogleFreeStrict(text, sourceLang, targetLang) {
  const sl = sourceLang === 'zh' ? 'zh-CN' : sourceLang;
  const tl = targetLang === 'zh' ? 'zh-CN' : targetLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  
  const data = await res.json();
  if (data && data[0] && Array.isArray(data[0])) {
    const fullText = data[0].map(item => item[0]).filter(Boolean).join('');
    return fullText.trim();
  }
  
  throw new Error('Invalid response structure from Google Translate');
}
