/**
 * Web Speech API Service
 * Mobile Friendly STT & TTS Service with Clean Permission Error Handling
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
let lastErrorTime = 0;

// Speech Recognition (STT)
export function startListening(config) {
  if (!SpeechRecognition) {
    if (config.onError) config.onError('이 브라우저에서는 음성 인식을 지원하지 않습니다. (Use Chrome/Safari)');
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
    
    // Support language mapping (ko -> ko-KR, th -> th-TH, en -> en-US, mn -> mn-MN)
    const rawLang = currentConfig?.lang || 'ko-KR';
    if (rawLang === 'ko') recognition.lang = 'ko-KR';
    else if (rawLang === 'th') recognition.lang = 'th-TH';
    else if (rawLang === 'en') recognition.lang = 'en-US';
    else if (rawLang === 'mn') recognition.lang = 'mn-MN';
    else recognition.lang = rawLang;

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
      const now = Date.now();
      
      // If microphone access is denied or not allowed on mobile, stop immediately to prevent endless popups
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        isListening = false;
        clearTimeout(restartTimer);

        if (now - lastErrorTime > 3000) {
          lastErrorTime = now;
          if (currentConfig?.onError) {
            currentConfig.onError('휴대폰 마이크 사용 권한을 허용해 주세요. (주소창 🔒 아이콘 터치)');
          }
        }
        return;
      }
    };

    recognition.onend = () => {
      // Only restart if explicitly still in listening state (not cancelled by permission errors)
      if (isListening) {
        clearTimeout(restartTimer);
        restartTimer = setTimeout(initAndStart, 300);
      }
    };

    recognition.start();
    activeRecognition = recognition;
  } catch (err) {
    if (isListening) {
      clearTimeout(restartTimer);
      restartTimer = setTimeout(initAndStart, 1000);
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
 * Get available installed voices
 */
export function getAvailableVoices(langPrefix = 'ko') {
  if (!isTTSSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
}

/**
 * Robust SpeechSynthesis (TTS)
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

      if (targetVoice) {
        utterance.voice = targetVoice;
      } else if (voices.length > 0) {
        utterance.voice = voices[0];
      }

      window.speechSynthesis.speak(utterance);
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
