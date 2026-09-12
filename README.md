# 🇹🇭🇰🇷 Thaicall - 실시간 양방향 한-태 자막 통번역 웹앱

화상 회의 시 나와 태국 파트너가 각각 휴대폰/브라우저로 접속하여, **내가 한국어로 말하면 태국 파트너 휴대폰에 태국어 자막이**, **태국 파트너가 태국어로 말하면 내 휴대폰에 한국어 자막이** 실시간으로 뜨는 100% 무료 WebRTC 기반 통번역 시스템입니다.

---

## ✨ 핵심 특징 및 장점

1. **100% 무료 운영 (Zero Costs)**
   - **Vercel Hosting**: 평생 무료 SSL(HTTPS) 웹 호스팅
   - **WebRTC (PeerJS)**: 중앙 서버 없는 P2P 지연시간 0초대 자막 전송
   - **Web Speech API**: 브라우저 내장 무료 STT & TTS
   - **Google Translate Free / Gemini AI**: 무료 기본 번역 탑재

2. **간편한 1-Click 접속**
   - 방 생성 시 **6자리 회의 코드** 및 **QR 코드** 자동 생성
   - 파트너가 카메라로 QR 코드를 스캔하거나 초대 링크 클릭 시 즉각 P2P 통번역 방 입장

3. **시각적 자막 & 음성 읽기**
   - 크고 명확한 프리미엄 Glassmorphism 자막 UI
   - 자막 수신 즉시 자동으로 상대방 언어를 음성(TTS)으로 읽어주는 옵션
   - 대화록 저장 기능 (`.txt` 다운로드)

---

## 🚀 GitHub 올리기 & Vercel 무료 배포 가이드

### 1단계: GitHub에 코드 올리기

1. [GitHub](https://github.com) 로그인 후 새 저장소(New Repository) 생성 (예: `thaicall`)
2. 내 컴퓨터의 터미널(Git Bash 또는 CMD)에서 다음 명령어로 코드 업로드:

```bash
git init
git add .
git commit -m "Initial commit for Thaicall"
git branch -M main
git remote add origin https://github.com/사용자이름/thaicall.git
git push -u origin main
```

---

### 2단계: Vercel에 무료 연결 배포하기

1. [Vercel](https://vercel.com) 접속 후 GitHub 계정으로 로그인 (Continue with GitHub)
2. **"Add New Project"** 버튼 클릭 ➔ 방금 올린 `thaicall` 저장소 **Import**
3. Framework Preset: **Vite** 자동 감지됨
4. **"Deploy"** 버튼 클릭!
5. 약 1분 후 `https://thaicall.vercel.app` 과 같은 **무료 웹 주소**가 완성됩니다.

---

## 📱 사용법 (How to Use)

1. **나 (한국인)**: Vercel 주소로 접속 ➔ 언어 `한국어` 선택 ➔ **[새 회의 생성]** 클릭
2. **태국 파트너**: 생성된 **QR 코드**를 파트너 휴대폰 카메라로 스캔하거나 **초대 링크** 전달
3. **통번역 대화**:
   - 하단 마이크 버튼 🎙️ 클릭 후 한국어로 자연스럽게 대화
   - 태국 파트너 휴대폰에 **태국어 자막**이 실시간으로 표출되며 음성으로 읽어줍니다!
   - 상대방이 태국어로 말하면 내 화면에 **한국어 자막**이 표출됩니다.

---

## ⚙️ 권장 브라우저

- **Android**: Google Chrome
- **iOS (iPhone/iPad)**: Safari 또는 Google Chrome
- *참고: 마이크 권한 사용을 위해 반드시 HTTPS(Vercel 주소)로 접속해야 합니다.*
