import React, { useState, useEffect } from 'react';
import RoomJoin from './components/RoomJoin';
import TranslationRoom from './components/TranslationRoom';
import SettingsModal from './components/SettingsModal';
import { isSpeechSupported } from './services/speechService';
import { AlertTriangle } from 'lucide-react';

import { LANGUAGES } from './constants/languages';

export default function App() {
  const [view, setView] = useState('join'); // 'join' | 'room'
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(true);
  const [myLang, setMyLang] = useState(() => {
    const browser = (navigator.language || '').toLowerCase();
    const match = LANGUAGES.find(l => browser.startsWith(l.code));
    return match ? match.code : 'ko';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    setSpeechSupported(isSpeechSupported());
  }, []);

  const handleJoinRoom = (id, hostFlag) => {
    setRoomId(id);
    setIsHost(hostFlag);
    setView('room');
  };

  const handleLeaveRoom = () => {
    setView('join');
    setRoomId('');
  };

  return (
    <>
      {/* Speech API browser warning banner if not supported */}
      {!speechSupported && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.2)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fef3c7',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span>
            현재 브라우저에서는 음성 인식을 지원하지 않습니다. <strong>Android Chrome</strong> 또는 <strong>iOS Safari / Chrome</strong> 브라우저를 이용해 주세요.
          </span>
        </div>
      )}

      {view === 'join' ? (
        <RoomJoin
          onJoinRoom={handleJoinRoom}
          onOpenSettings={() => setIsSettingsOpen(true)}
          myLang={myLang}
          setMyLang={setMyLang}
        />
      ) : (
        <TranslationRoom
          roomId={roomId}
          isHost={isHost}
          myLang={myLang}
          onLeave={handleLeaveRoom}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {}}
      />
    </>
  );
}
