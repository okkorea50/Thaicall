import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Video, Copy, Check, ArrowRight, Settings, Sparkles, Globe2, LogIn } from 'lucide-react';

const UI_TEXTS = {
  ko: {
    tagline: '실시간 양방향 대화 자막 통번역',
    subdesc: '모바일 브라우저로 접속하는 실시간 자막 통번역 시스템',
    selectLang: '내 언어 선택 / Select Your Language',
    createTitle: '새 통번역 회의 방 만들기',
    createDesc: '버튼을 누르면 회의 코드 및 QR 접속 코드가 생성됩니다.',
    createBtn: '새 회의 생성 (Create Room)',
    roomCodeLabel: '회의 코드:',
    qrDesc: '아래 QR코드를 파트너 휴대폰으로 스캔하거나 링크를 전달하세요.',
    copyLinkBtn: '초대 링크 복사하기',
    copiedNotice: '초대 링크가 복사되었습니다!',
    enterRoomBtn: '회의 입장하기 (Enter Room)',
    joinTitle: '초대받은 회의 코드로 입장',
    joinInputPlaceholder: '예: TC-8492',
    joinBtn: '참여',
    settingsBtn: '통번역 엔진 및 Gemini AI 설정'
  },
  th: {
    tagline: 'ระบบแปลคำบรรยายการสนทนาแบบเรียลไทม์',
    subdesc: 'ระบบแปลคำบรรยายสด 2 ทิศทางผ่านเบราว์เซอร์มือถือ',
    selectLang: 'เลือกภาษาของคุณ (Select Your Language)',
    createTitle: 'สร้างห้องประชุมแปลภาษาใหม่',
    createDesc: 'กดปุ่มเพื่อสร้างรหัสห้องประชุมและคิวอาร์โค้ด',
    createBtn: 'สร้างห้องประชุม (Create Room)',
    roomCodeLabel: 'รหัสห้องประชุม:',
    qrDesc: 'สแกนคิวอาร์โค้ดด้านล่างหรือส่งลิงก์ให้คู่สนทนาของคุณ',
    copyLinkBtn: 'คัดลอกลิงก์คำเชิญ',
    copiedNotice: 'คัดลอกลิงก์คำเชิญเรียบร้อยแล้ว!',
    enterRoomBtn: 'เข้าสู่ห้องประชุม (Enter Room)',
    joinTitle: 'เข้าร่วมด้วยรหัสห้องประชุม',
    joinInputPlaceholder: 'ตัวอย่าง: TC-8492',
    joinBtn: 'เข้าร่วม',
    settingsBtn: 'การตั้งค่าเอ็นจินแปลภาษา & Gemini AI'
  },
  en: {
    tagline: 'Real-time 2-Way Subtitle Translator',
    subdesc: 'Real-time subtitle translation via mobile browser',
    selectLang: 'Select Your Language',
    createTitle: 'Create New Meeting Room',
    createDesc: 'Click the button to generate a room code and QR code.',
    createBtn: 'Create Room',
    roomCodeLabel: 'Room Code:',
    qrDesc: 'Scan the QR code below or share the link with your partner.',
    copyLinkBtn: 'Copy Invite Link',
    copiedNotice: 'Invite link copied to clipboard!',
    enterRoomBtn: 'Enter Room',
    joinTitle: 'Join with Room Code',
    joinInputPlaceholder: 'e.g. TC-8492',
    joinBtn: 'Join',
    settingsBtn: 'Translation Engine & Gemini AI Settings'
  },
  mn: {
    tagline: 'Бодит цагийн 2 талт орчуулгын систем',
    subdesc: 'Гар утасны хөтчөөр дамжуулан шууд хадмал орчуулга хийх',
    selectLang: 'Хэлээ сонгоно уу (Select Your Language)',
    createTitle: 'Шинэ уулзалтын өрөө үүсгэх',
    createDesc: 'Өрөөний код болон QR код үүсгэхийн тулд товчлуурыг дарна уу.',
    createBtn: 'Өрөө үүсгэх (Create Room)',
    roomCodeLabel: 'Өрөөний код:',
    qrDesc: 'Доорх QR кодыг уншуулах эсвэл холбоосыг хамтрагчдаа илгээнэ үү.',
    copyLinkBtn: 'Урилгын холбоосыг хуулах',
    copiedNotice: 'Холбоосыг хууллаа!',
    enterRoomBtn: 'Өрөө рүү орох (Enter Room)',
    joinTitle: 'Өрөөний кодоор орох',
    joinInputPlaceholder: 'Жишээ: TC-8492',
    joinBtn: 'Орох',
    settingsBtn: 'Орчуулгын систем болон Gemini AI тохиргоо'
  }
};

export default function RoomJoin({ onJoinRoom, onOpenSettings, myLang, setMyLang }) {
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomInput(roomParam.trim().toUpperCase());
      if (!navigator.language.startsWith('ko')) {
        if (navigator.language.startsWith('th')) {
          setMyLang('th');
        } else if (navigator.language.startsWith('mn')) {
          setMyLang('mn');
        } else {
          setMyLang('en');
        }
      }
    }
  }, []);

  const t = UI_TEXTS[myLang] || UI_TEXTS.ko;

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
      maxWidth: '520px',
      margin: '30px auto 20px',
      padding: '0 16px',
      width: '100%'
    }}>
      {/* Header Brand */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '12px'
        }}>
          <Sparkles size={14} color="#6366f1" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8' }}>
            {t.tagline}
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Thaicall <span style={{ color: '#6366f1' }}>Live</span>
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)' }}>
          {t.subdesc}
        </p>
      </div>

      {/* Language Selector Buttons */}
      <div className="glass-panel" style={{ padding: '18px', marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '10px', fontWeight: 600 }}>
          <Globe2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {t.selectLang}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className={`glass-button ${myLang === 'ko' ? 'primary' : ''}`}
            onClick={() => setMyLang('ko')}
            style={{ padding: '10px 8px', fontSize: '0.85rem' }}
          >
            🇰🇷 한국어
          </button>
          <button
            type="button"
            className={`glass-button ${myLang === 'th' ? 'primary' : ''}`}
            onClick={() => setMyLang('th')}
            style={{ padding: '10px 8px', fontSize: '0.85rem', fontFamily: 'var(--font-th)' }}
          >
            🇹🇭 ภาษาไทย
          </button>
          <button
            type="button"
            className={`glass-button ${myLang === 'en' ? 'primary' : ''}`}
            onClick={() => setMyLang('en')}
            style={{ padding: '10px 8px', fontSize: '0.85rem' }}
          >
            🇺🇸 English
          </button>
          <button
            type="button"
            className={`glass-button ${myLang === 'mn' ? 'primary' : ''}`}
            onClick={() => setMyLang('mn')}
            style={{ padding: '10px 8px', fontSize: '0.85rem' }}
          >
            🇲🇳 Монгол
          </button>
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
