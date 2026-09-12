/**
 * Multi-Language High-Precision Translation Service (KR <-> TH <-> EN)
 * Strict Zero-Hallucination Translation Engine
 */

const translationCache = new Map();

const LANG_NAMES = {
  ko: 'Korean',
  th: 'Thai',
  en: 'English'
};

/**
 * Translate text between selected languages
 * @param {string} text - Source text
 * @param {string} sourceLang - 'ko', 'th', 'en'
 * @param {string} targetLang - 'ko', 'th', 'en'
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

  const { geminiApiKey, engine = 'google' } = options;

  let translated = '';

  try {
    if (engine === 'gemini' && geminiApiKey) {
      translated = await translateWithGeminiStrict(cleanText, sourceLang, targetLang, geminiApiKey);
    } else {
      translated = await translateWithGoogleFreeStrict(cleanText, sourceLang, targetLang);
    }
  } catch (err) {
    console.warn('[Translate] Primary engine failed, attempting fallback...', err);
    try {
      translated = await translateWithMyMemory(cleanText, sourceLang, targetLang);
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
  const sourceName = LANG_NAMES[sourceLang] || sourceLang;
  const targetName = LANG_NAMES[targetLang] || targetLang;

  const systemInstruction = `You are a strict, ultra-precise ${sourceName}-to-${targetName} real-time translator.
CRITICAL RULES:
1. Translate the input sentence into ${targetName} with 100% fidelity.
2. NEVER add extra people, pronouns, or details that were NOT present in the original sentence (e.g. NEVER add "with him", "with her", or extra context).
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
        temperature: 0.0, // Absolute zero temperature for strict deterministic translation
        maxOutputTokens: 200 
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
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  
  const data = await res.json();
  if (data && data[0] && Array.isArray(data[0])) {
    const fullText = data[0].map(item => item[0]).filter(Boolean).join('');
    return fullText.trim();
  }
  
  throw new Error('Invalid response structure from Google Translate');
}

/**
 * MyMemory Free Translation Fallback
 */
async function translateWithMyMemory(text, sourceLang, targetLang) {
  const langpair = `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

  const data = await res.json();
  if (data.responseData && data.responseData.translatedText) {
    return data.responseData.translatedText;
  }

  throw new Error('Invalid response structure from MyMemory');
}
