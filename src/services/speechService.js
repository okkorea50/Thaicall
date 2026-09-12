/**
 * Web Speech API Service
 * Standard reliable STT & TTS Service with Robust Voice Fallback
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSpeechSupported() {
  return !!SpeechRecognition;
}

export function isTTSSupported() {
  return 'speechSynthesis' in window;
}

let isListening = false;
let currentConfig = null;
let activeRecognition = null;
let restartTimer = null;

// Speech Recognition (STT)
export function startListening(config) {
  if (!SpeechRecognition) {
    if (config.onError) config.onError('Web Speech API가 지원되지 않는 브라우저입니다.');
    return null;
  }

  isListening = true;
  currentConfig = config;

  initAndStart();
}

function initAndStart() {
  if (!isListening) return;

  if (activeRecognition) {
    try {
      activeRecognition.onend = null;
      activeRecognition.onerror = null;
      activeRecognition.onresult = null;
      activeRecognition.abort();
    } catch (e) {}
    activeRecognition = null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = currentConfig?.lang || 'ko-KR';

    let lastText = '';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        lastText = final.trim();
        if (currentConfig?.onResult) {
          currentConfig.onResult('', lastText);
        }
      } else if (interim) {
        if (currentConfig?.onResult) {
          currentConfig.onResult(interim, '');
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn('[Speech] Error event:', event.error);
      if (event.error === 'not-allowed') {
        isListening = false;
        if (currentConfig?.onError) {
          currentConfig.onError('마이크 권한이 필요합니다.');
        }
      }
    };

    recognition.onend = () => {
      if (isListening) {
        clearTimeout(restartTimer);
        restartTimer = setTimeout(initAndStart, 200);
      }
    };

    recognition.start();
    activeRecognition = recognition;
  } catch (err) {
    if (isListening) {
      clearTimeout(restartTimer);
      restartTimer = setTimeout(initAndStart, 500);
    }
  }
}

export function stopListening() {
  isListening = false;
  clearTimeout(restartTimer);

  if (activeRecognition) {
    try {
      activeRecognition.onend = null;
      activeRecognition.stop();
    } catch (e) {}
    activeRecognition = null;
  }
}

/**
 * Get available installed voices for target language prefix ('ko' or 'th')
 */
export function getAvailableVoices(langPrefix = 'ko') {
  if (!isTTSSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
}

/**
 * Robust SpeechSynthesis (TTS) with Fallback for Missing OS Language Packs
 */
export function speakText(text, lang = 'ko-KR', rate = 1.0, voiceUri = '') {
  if (!isTTSSupported() || !text || !text.trim()) return;

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.cancel();

    const cleanText = text.trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.volume = 1.0;

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const prefix = lang.split('-')[0];

      let targetVoice = null;
      if (voiceUri) {
        targetVoice = voices.find(v => v.voiceURI === voiceUri);
      }
      if (!targetVoice) {
        targetVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
      }

      // Fallback: If specific language pack (e.g. th-TH on Windows) is missing, use default voice so it never stays silent!
      if (targetVoice) {
        utterance.voice = targetVoice;
      } else if (voices.length > 0) {
        console.warn(`[TTS] Language voice for ${lang} not found on this OS. Using fallback voice:`, voices[0].name);
        utterance.voice = voices[0];
      }

      window.speechSynthesis.speak(utterance);
      console.log('[TTS] Successfully triggering speech utterance for:', cleanText);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        doSpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      setTimeout(doSpeak, 100);
    }
  } catch (e) {
    console.error('[TTS] Speech error:', e);
  }
}
