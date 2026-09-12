import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, PhoneOff, Settings, 
  MessageSquare, Download, Copy, Check, Users, Send
} from 'lucide-react';
import { peerService } from '../services/peerService';
import { startListening, stopListening } from '../services/speechService';
import { translateText, DEFAULT_GEMINI_KEY } from '../services/translateService';

export default function TranslationRoom({ roomId, isHost, myLang, onLeave, onOpenSettings }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [partnerLang, setPartnerLang] = useState(() => {
    if (myLang === 'ko') return 'en';
    if (myLang === 'th') return 'ko';
    return 'ko';
  });
  
  // Microphone & Input states
  const [isMicActive, setIsMicActive] = useState(false);
  const [myInterimSpeech, setMyInterimSpeech] = useState('');
  const [myLastSpoken, setMyLastSpoken] = useState('');
  const [manualText, setManualText] = useState('');
  
  // Subtitle Displays
  const [partnerSubtitle, setPartnerSubtitle] = useState({
    original: '',
    translated: '상대방의 자막을 기다리는 중입니다... (Waiting for subtitles)',
    timestamp: null
  });

  // History Log
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [sharedHostConfig, setSharedHostConfig] = useState({ engine: 'google', geminiApiKey: '' });

  const historyEndRef = useRef(null);

  // 1. Initialize Peer & Listeners
  useEffect(() => {
    let mounted = true;

    async function initRoom() {
      try {
        setConnectionStatus('connecting');
        
        if (isHost) {
          console.log('[Room] Initializing as HOST with Room ID:', roomId);
          await peerService.init(roomId);
        } else {
          console.log('[Room] Initializing as JOINER, connecting to HOST:', roomId);
          await peerService.init();
          peerService.connect(roomId);
        }
      } catch (err) {
        console.error('[Room] Peer init error:', err);
        if (mounted) setConnectionStatus('error');
      }
    }

    initRoom();

    peerService.onStatusChange((status, extra) => {
      if (!mounted) return;
      if (status === 'connected') {
        setConnectionStatus('connected');
        
        // Host shares Translation Engine & Gemini Key with Joiner
        const myEngine = localStorage.getItem('thaicall_engine') || 'google';
        const myGeminiKey = localStorage.getItem('thaicall_gemini_key') || '';

        peerService.sendSubtitle({
          type: 'meta_config',
          lang: myLang,
          engine: myEngine,
          geminiApiKey: myGeminiKey
        });
      } else if (status === 'partner_disconnected' || status === 'disconnected') {
        setConnectionStatus('disconnected');
      }
    });

    peerService.onSubtitle((data) => {
      if (!mounted) return;

      if (data.type === 'meta_config') {
        if (data.lang) setPartnerLang(data.lang);
        if (data.engine && data.geminiApiKey) {
          setSharedHostConfig({
            engine: data.engine,
            geminiApiKey: data.geminiApiKey
          });
        }
        return;
      }

      if (data.translatedText || data.originalText) {
        setPartnerSubtitle({
          original: data.originalText || '',
          translated: data.translatedText || data.originalText,
          timestamp: data.timestamp || Date.now()
        });

        // Add to transcript log only when final
        if (!data.isInterim) {
          setHistory(prev => [...prev, {
            sender: 'partner',
            original: data.originalText,
            translated: data.translatedText,
            time: new Date(data.timestamp || Date.now()).toLocaleTimeString()
          }]);
        }
      }
    });

    return () => {
      mounted = false;
      stopListening();
      peerService.disconnect();
    };
  }, [roomId, isHost, myLang]);

  // Auto scroll history
  useEffect(() => {
    if (showHistory && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showHistory]);

  // Microphone Permission Warning Notice
  const [micErrorNotice, setMicErrorNotice] = useState('');

  // 2. Microphone Toggle Handler
  const toggleMicrophone = () => {
    if (isMicActive) {
      stopListening();
      setIsMicActive(false);
      setMyInterimSpeech('');
    } else {
      setMicErrorNotice('');
      const speechLang = myLang === 'ko' ? 'ko-KR' : myLang === 'th' ? 'th-TH' : 'en-US';
      
      startListening({
        lang: speechLang,
        onResult: async (interim, final) => {
          if (interim) {
            setMyInterimSpeech(interim);
          }
          if (final) {
            console.log('[STT Final Result]:', final);
            setMyInterimSpeech('');
            setMyLastSpoken(final);
            await processAndSendSpeech(final);
          }
        },
        onError: (err) => {
          console.warn('Speech error notice:', err);
          setIsMicActive(false);
          setMicErrorNotice(err);
          setTimeout(() => setMicErrorNotice(''), 4000);
        },
        onEnd: () => {
          // Stopped
        }
      });

      setIsMicActive(true);
    }
  };

  // Manual Text Form Submit
  const handleManualTextSubmit = async (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    const textToSend = manualText.trim();
    setManualText('');
    setMyLastSpoken(textToSend);
    await processAndSendSpeech(textToSend);
  };

  // 3. Process Speech & Translate & Send P2P Payload
  const processAndSendSpeech = async (spokenText) => {
    // Dynamic target language based on partner's language choice
    const targetLang = partnerLang || (myLang === 'ko' ? 'en' : 'ko');

    console.log(`[Translate] Processing speech: "${spokenText}" (${myLang} -> ${targetLang})`);

    // Priority: Local setting -> Shared Host config -> Default Embedded Gemini Key
    const localEngine = localStorage.getItem('thaicall_engine');
    const localKey = localStorage.getItem('thaicall_gemini_key');

    const engine = localEngine || sharedHostConfig.engine || 'gemini';
    const geminiApiKey = localKey || sharedHostConfig.geminiApiKey || DEFAULT_GEMINI_KEY;

    try {
      const translated = await translateText(spokenText, myLang, targetLang, {
        engine,
        geminiApiKey
      });

      console.log(`[Translate] Output translated: "${translated}"`);

      // Send via PeerJS to partner
      peerService.sendSubtitle({
        originalText: spokenText,
        translatedText: translated,
        senderLang: myLang
      });

      // Add to local history log
      setHistory(prev => [...prev, {
        sender: 'me',
        original: spokenText,
        translated: translated,
        time: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error('Failed to translate and send speech:', err);
    }
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedRoomCode(true);
    setTimeout(() => setCopiedRoomCode(false), 2000);
  };

  const handleDownloadTranscript = () => {
    const content = history.map(item => 
      `[${item.time}] ${item.sender === 'me' ? '나 (Me)' : '상대방 (Partner)'}\n- 원문 (${item.sender === 'me' ? myLang : partnerLang}): ${item.original}\n- 번역: ${item.translated}\n`
    ).join('\n----------------------------------------\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Thaicall_Transcript_${roomId}_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '720px',
      margin: '0 auto',
      width: '100%',
      position: 'relative'
    }}>
      {/* Top Header Bar */}
      <header className="glass-panel" style={{
        margin: '12px 12px 0 12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        zIndex: 10
      }}>
        {/* Room Code Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleCopyRoom}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            {copiedRoomCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{roomId}</span>
          </button>

          {/* Connection Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '12px',
            background: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: connectionStatus === 'connected' ? '#34d399' : '#fbbf24',
            border: `1px solid ${connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 8px ${connectionStatus === 'connected' ? '#10b981' : '#f59e0b'}`
            }} />
            {connectionStatus === 'connected' ? '연결 완료 (Connected)' : '상대방 접속 대기 중...'}
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="glass-button"
            style={{ padding: '8px', borderRadius: '12px', position: 'relative' }}
            title="대화 기록"
          >
            <MessageSquare size={18} />
            {history.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#6366f1',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.65rem',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="glass-button"
            style={{ padding: '8px', borderRadius: '12px' }}
            title="설정"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={onLeave}
            className="glass-button danger"
            style={{ padding: '8px 12px', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <PhoneOff size={16} /> 나가기
          </button>
        </div>
      </header>

      {/* Mic Permission Warning Banner */}
      {micErrorNotice && (
        <div style={{
          margin: '8px 12px 0 12px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'rgba(244, 63, 94, 0.25)',
          border: '1px solid rgba(244, 63, 94, 0.5)',
          color: '#fecdd3',
          fontSize: '0.85rem',
          textAlign: 'center',
          fontWeight: 600,
          zIndex: 10
        }}>
          {micErrorNotice}
        </div>
      )}

      {/* Main Subtitle Display Area */}
      <main style={{
        flex: 1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
        overflowY: 'auto'
      }}>
        {/* Partner Subtitle Overlay Card */}
        <div className="glass-panel" style={{
          flex: 1,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          border: '1px solid var(--border-highlight)',
          position: 'relative',
          minHeight: '260px',
          background: 'linear-gradient(180deg, rgba(26, 32, 53, 0.85) 0%, rgba(15, 23, 42, 0.85) 100%)'
        }}>
          <div style={{
            position: 'absolute',
            top: '18px',
            left: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Users size={14} />
            <span>상대방 자막 (Partner Subtitle)</span>
            <span style={{
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.7rem'
            }}>
              {(partnerLang === 'ko' ? '한국어' : partnerLang === 'th' ? '태국어' : partnerLang === 'mn' ? '몽골어' : '영어')} ➔ {(myLang === 'ko' ? '한국어' : myLang === 'th' ? '태국어' : myLang === 'mn' ? '몽골어' : '영어')}
            </span>
          </div>

          {/* Subtitle Text */}
          <div style={{ margin: 'auto 0' }}>
            <h2 style={{
              fontSize: partnerSubtitle.translated.length > 50 ? '1.6rem' : '2.1rem',
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.4,
              letterSpacing: '-0.3px',
              marginBottom: partnerSubtitle.original ? '12px' : '0',
              fontFamily: myLang === 'ko' ? 'var(--font-kr)' : 'var(--font-th)',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)'
            }}>
              {partnerSubtitle.translated}
            </h2>

            {partnerSubtitle.original && (
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                fontFamily: myLang === 'ko' ? 'var(--font-th)' : 'var(--font-kr)'
              }}>
                "{partnerSubtitle.original}"
              </p>
            )}
          </div>
        </div>

        {/* My Speech / Input Preview Box */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderColor: isMicActive ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: isMicActive ? '#34d399' : 'var(--text-muted)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isMicActive ? '#10b981' : '#64748b'
              }} />
              {isMicActive ? '음성 감지 중... (Speaking)' : '내가 보낸 자막 미리보기'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              내 언어: {myLang === 'ko' ? '🇰🇷 한국어' : '🇹🇭 ภาษาไทย'}
            </span>
          </div>

          <p style={{
            fontSize: '1.05rem',
            color: myInterimSpeech ? '#6366f1' : 'var(--text-main)',
            fontWeight: 500,
            lineHeight: 1.4,
            fontFamily: myLang === 'ko' ? 'var(--font-kr)' : 'var(--font-th)'
          }}>
            {myInterimSpeech || myLastSpoken || '아래 메시지 창에 치시거나 마이크를 켜고 말씀하세요.'}
          </p>
        </div>
      </main>

      {/* Floating Subtitle Input Control Bar */}
      <footer className="glass-panel" style={{
        margin: '0 12px 16px 12px',
        padding: '12px 16px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        borderRadius: '20px',
        zIndex: 10
      }}>
        {/* Microphone Toggle Button */}
        <button
          onClick={toggleMicrophone}
          className={`glass-button ${isMicActive ? 'mic-active-pulse' : ''}`}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            padding: 0,
            flexShrink: 0,
            background: isMicActive 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            border: `2px solid ${isMicActive ? 'rgba(52, 211, 153, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`
          }}
          title={isMicActive ? '마이크 끄기' : '마이크 켜기'}
        >
          {isMicActive ? <Mic size={22} color="#ffffff" /> : <MicOff size={22} color="#94a3b8" />}
        </button>

        {/* Text Input Form */}
        <form onSubmit={handleManualTextSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input
            type="text"
            className="glass-input"
            placeholder={myLang === 'ko' ? '한국어로 자막 메시지 입력...' : 'พิมพ์ข้อความที่นี่...'}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            style={{ fontSize: '0.95rem', padding: '12px 16px', flex: 1 }}
          />
          <button
            type="submit"
            className="glass-button primary"
            disabled={!manualText.trim()}
            style={{ padding: '12px 18px', flexShrink: 0 }}
          >
            <Send size={16} /> 전송
          </button>
        </form>
      </footer>

      {/* Transcript Log Modal Drawer */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            height: '100%',
            borderRadius: 0,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#6366f1" /> 대화록 (Transcript History)
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleDownloadTranscript} className="glass-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Download size={14} /> 저장 (.txt)
                </button>
                <button onClick={() => setShowHistory(false)} className="glass-button" style={{ padding: '6px 10px' }}>
                  닫기
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {history.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '0.9rem' }}>
                  아직 기록된 대화 자막이 없습니다.
                </p>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} style={{
                    alignSelf: item.sender === 'me' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: item.sender === 'me' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${item.sender === 'me' ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {item.sender === 'me' ? '나 (Me)' : '상대방 (Partner)'} • {item.time}
                    </div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {item.translated}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontStyle: 'italic' }}>
                      {item.original}
                    </p>
                  </div>
                ))
              )}
              <div ref={historyEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
