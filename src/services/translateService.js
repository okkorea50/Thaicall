/**
 * Real-time High-Precision Translation Service (KR <-> TH)
 * Optimized for natural, polite conversational business dialogue
 */

const translationCache = new Map();

/**
 * Translate text between Korean (ko) and Thai (th)
 * @param {string} text - Source text
 * @param {string} sourceLang - 'ko' or 'th'
 * @param {string} targetLang - 'th' or 'ko'
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
      translated = await translateWithGeminiHighQuality(cleanText, sourceLang, targetLang, geminiApiKey);
    } else {
      translated = await translateWithGoogleFree(cleanText, sourceLang, targetLang);
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
 * High-Precision Gemini AI Translator Prompt
 */
async function translateWithGeminiHighQuality(text, sourceLang, targetLang, apiKey) {
  const isKrToTh = sourceLang === 'ko' && targetLang === 'th';

  const systemInstruction = isKrToTh
    ? `You are an expert real-time Korean-to-Thai translator for business video calls. 
Translate the input Korean sentence into natural, fluent, and polite spoken Thai (using appropriate polite particles like ครับ/ค่ะ where natural). 
Do NOT perform literal word-for-word translation. 
Output ONLY the final translated Thai sentence without any quotes, explanations, or extra commentary.`
    : `You are an expert real-time Thai-to-Korean translator for business video calls. 
Translate the input Thai sentence into natural, fluent, polite Korean (존댓말). 
Do NOT perform literal word-for-word translation. 
Output ONLY the final translated Korean sentence without any quotes, explanations, or extra commentary.`;

  const prompt = `Input sentence: "${text}"\nTranslated text:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
      generationConfig: { 
        temperature: 0.1, // Low temperature for high translation accuracy & consistency
        maxOutputTokens: 300 
      }
    })
  });

  if (!res.ok) throw new Error(`Gemini API HTTP ${res.status}`);

  const data = await res.json();
  const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (output) {
    return output.trim().replace(/^["']|["']$/g, ''); // Remove surrounding quotes if any
  }

  throw new Error('Invalid response structure from Gemini API');
}

/**
 * Google Free Translate API Endpoint
 */
async function translateWithGoogleFree(text, sourceLang, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  
  const data = await res.json();
  if (data && data[0] && Array.isArray(data[0])) {
    return data[0].map(item => item[0]).filter(Boolean).join(' ');
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
