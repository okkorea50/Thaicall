import React, { useState, useEffect } from 'react';
import { X, Key, Zap, Save, Globe } from 'lucide-react';
import { DEFAULT_GEMINI_KEY } from '../services/translateService';

export default function SettingsModal({ isOpen, onClose, onSave }) {
  const [engine, setEngine] = useState('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState(DEFAULT_GEMINI_KEY);

  useEffect(() => {
    const savedEngine = localStorage.getItem('thaicall_engine') || 'gemini';
    const savedKey = localStorage.getItem('thaicall_gemini_key') || DEFAULT_GEMINI_KEY;

    setEngine(savedEngine);
    setGeminiApiKey(savedKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('thaicall_engine', engine);
    localStorage.setItem('thaicall_gemini_key', geminiApiKey.trim());

    if (onSave) {
      onSave({
        engine,
        geminiApiKey: geminiApiKey.trim()
      });
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '24px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="#6366f1" /> 실시간 번역 엔진 설정
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Translation Engine Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '8px', fontWeight: 600 }}>
            번역 품질 모드 선택 (Translation Quality)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setEngine('google')}
              className={`glass-button ${engine === 'google' ? 'primary' : ''}`}
              style={{ padding: '14px 10px', fontSize: '0.85rem' }}
            >
              <Globe size={16} /> Google (일반 번역)
            </button>
            <button
              type="button"
              onClick={() => setEngine('gemini')}
              className={`glass-button ${engine === 'gemini' ? 'primary' : ''}`}
              style={{ padding: '14px 10px', fontSize: '0.85rem' }}
            >
              <Zap size={16} /> Gemini AI (고품질 대화체)
            </button>
          </div>
        </div>

        {/* Gemini API Key input */}
        {engine === 'gemini' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '6px', fontWeight: 600 }}>
              <Key size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Gemini API Key (무료 키)
            </label>
            <input
              type="password"
              className="glass-input"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
              Google AI Studio에서 무료로 생성한 API Key를 저장해 두시면 100% 매끄러운 고품질 대화체로 자동 번역됩니다.
            </p>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          className="glass-button primary"
          style={{ width: '100%', marginTop: '10px', padding: '14px' }}
        >
          <Save size={18} /> 설정 저장하기 (Save Settings)
        </button>
      </div>
    </div>
  );
}
