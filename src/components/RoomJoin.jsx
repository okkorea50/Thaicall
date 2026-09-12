import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Video, Copy, Check, ArrowRight, Settings, Sparkles, Globe2, LogIn } from 'lucide-react';

export default function RoomJoin({ onJoinRoom, onOpenSettings, myLang, setMyLang }) {
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomInput(roomParam.trim().toUpperCase());
    }
  }, []);

  const handleCreateRoom = () => {
    const randomCode = `TC-${Math.floor(1000 + Math.random() * 9000)}`;
    setCreatedRoomId(randomCode);
  };

  const getShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?room=${createdRoomId}`;
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard error:', e);
    }
  };

  const handleStartHostRoom = () => {
    if (createdRoomId) {
      onJoinRoom(createdRoomId, true);
    }
  };

  const handleJoinExistingRoom = (e) => {
    e.preventDefault();
    if (joinRoomInput.trim()) {
      onJoinRoom(joinRoomInput.trim().toUpperCase(), false);
    }
  };

  return (
    <div style={{
      maxWidth: '460px',
      margin: '40px auto 20px',
      padding: '0 16px',
      width: '100%'
    }}>
      {/* Header Brand */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '14px'
        }}>
          <Sparkles size={14} color="#6366f1" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8' }}>
            Real-time KR ↔ TH Subtitle Translator
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Thaicall <span style={{ color: '#6366f1' }}>Live</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
          모바일 브라우저로 접속하는 실시간 양방향 한-태 자막 통번역
        </p>
      </div>

      {/* Language Selector */}
      <div className="glass-panel" style={{ padding: '18px', marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '10px', fontWeight: 600 }}>
          <Globe2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
          내 언어 선택 / Select Your Language
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            className={`glass-button ${myLang === 'ko' ? 'primary' : ''}`}
            onClick={() => setMyLang('ko')}
            style={{ padding: '12px' }}
          >
            🇰🇷 한국어
          </button>
          <button
            type="button"
            className={`glass-button ${myLang === 'th' ? 'primary' : ''}`}
            onClick={() => setMyLang('th')}
            style={{ padding: '12px', fontFamily: 'var(--font-th)' }}
          >
            🇹🇭 ภาษาไทย
          </button>
        </div>
      </div>

      {/* Room Action Cards */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '18px' }}>
        {!createdRoomId ? (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
              새 통번역 회의 방 만들기
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
              버튼을 누르면 회의 코드 및 QR 접속 코드가 생성됩니다.
            </p>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="glass-button primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              <Video size={18} /> 새 회의 생성 (Create Room)
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              회의 코드: <span style={{ color: '#6366f1' }}>{createdRoomId}</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '14px' }}>
              아래 QR코드를 태국 파트너 휴대폰으로 스캔하거나 링크를 전달하세요.
            </p>

            {/* QR Code */}
            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              display: 'inline-block',
              marginBottom: '14px'
            }}>
              <QRCodeSVG value={getShareUrl()} size={140} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <button
                type="button"
                onClick={handleCopyLink}
                className="glass-button"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                {copied ? '초대 링크가 복사되었습니다!' : '초대 링크 복사하기'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleStartHostRoom}
              className="glass-button primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              회의 입장하기 (Enter Room) <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Join Existing Room */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px' }}>
          초대받은 회의 코드로 입장
        </h3>
        <form onSubmit={handleJoinExistingRoom}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="예: TC-8492"
              value={joinRoomInput}
              onChange={(e) => setJoinRoomInput(e.target.value)}
              style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}
            />
            <button
              type="submit"
              className="glass-button primary"
              disabled={!joinRoomInput.trim()}
              style={{ whiteSpace: 'nowrap', padding: '12px 18px' }}
            >
              <LogIn size={16} /> 참여
            </button>
          </div>
        </form>
      </div>

      {/* Settings Footer */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onOpenSettings}
          className="glass-button"
          style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}
        >
          <Settings size={15} /> 통번역 엔진 및 Gemini API 설정
        </button>
      </div>
    </div>
  );
}
