import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Video, Copy, Check, ArrowRight, Settings, Sparkles, Globe2, LogIn, Search, X } from 'lucide-react';
import { LANGUAGES, getLanguage, getUIText } from '../constants/languages';

export default function RoomJoin({ onJoinRoom, onOpenSettings, myLang, setMyLang }) {
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  // Auto-detect language from URL or browser
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomInput(roomParam.trim().toUpperCase());
      const browserLang = (navigator.language || '').toLowerCase();
      const matched = LANGUAGES.find(l => browserLang.startsWith(l.code));
      if (matched) {
        setMyLang(matched.code);
      } else if (!browserLang.startsWith('ko')) {
        setMyLang('en');
      }
    }
  }, [setMyLang]);

  const t = getUIText(myLang);
  const currentLangObj = getLanguage(myLang);

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return LANGUAGES;
    const q = langSearch.trim().toLowerCase();
    return LANGUAGES.filter(l => 
      l.name.toLowerCase().includes(q) ||
      l.native.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.prompt.toLowerCase().includes(q)
    );
  }, [langSearch]);

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
      maxWidth: '540px',
      margin: '24px auto 20px',
      padding: '0 16px',
      width: '100%'
    }}>
      {/* Header Brand */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '10px'
        }}>
          <Sparkles size={14} color="#6366f1" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8' }}>
            {t.tagline}
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
          UniSub <span style={{ color: '#6366f1' }}>Live</span>
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)' }}>
          {t.subdesc}
        </p>
      </div>

      {/* 20 Languages Selector Panel */}
      <div className="glass-panel" style={{ padding: '16px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe2 size={16} color="#818cf8" />
            {t.selectLang}
          </label>
          <span style={{
            fontSize: '0.78rem',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#c7d2fe',
            fontWeight: 700
          }}>
            {currentLangObj.flag} {currentLangObj.native}
          </span>
        </div>

        {/* Language Search Input */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="glass-input"
            placeholder={t.searchPlaceholder || '언어 또는 국가 검색...'}
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            style={{
              padding: '9px 32px 9px 34px',
              fontSize: '0.85rem',
              borderRadius: '12px'
            }}
          />
          {langSearch && (
            <button
              onClick={() => setLangSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Responsive Language Buttons Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
          gap: '8px',
          maxHeight: '220px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {filteredLanguages.map(l => {
            const isSelected = myLang === l.code;
            return (
              <button
                key={l.code}
                type="button"
                className={`glass-button ${isSelected ? 'primary' : ''}`}
                onClick={() => setMyLang(l.code)}
                style={{
                  padding: '9px 6px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  lineHeight: 1.25,
                  borderRadius: '12px',
                  border: isSelected ? '1.5px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <span style={{ fontSize: '1.3rem', marginBottom: '3px' }}>{l.flag}</span>
                <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{l.native}</span>
                <span style={{ fontSize: '0.7rem', color: isSelected ? '#e0e7ff' : 'var(--text-muted)' }}>
                  {l.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Room Action Cards */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '18px' }}>
        {!createdRoomId ? (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
              {t.createTitle}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
              {t.createDesc}
            </p>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="glass-button primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              <Video size={18} /> {t.createBtn}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              {t.roomCodeLabel} <span style={{ color: '#6366f1' }}>{createdRoomId}</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '14px' }}>
              {t.qrDesc}
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
                {copied ? t.copiedNotice : t.copyLinkBtn}
              </button>
            </div>

            <button
              type="button"
              onClick={handleStartHostRoom}
              className="glass-button primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {t.enterRoomBtn} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Join Existing Room */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px' }}>
          {t.joinTitle}
        </h3>
        <form onSubmit={handleJoinExistingRoom}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="glass-input"
              placeholder={t.joinInputPlaceholder}
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
              <LogIn size={16} /> {t.joinBtn}
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
          <Settings size={15} /> {t.settingsBtn}
        </button>
      </div>
    </div>
  );
}
