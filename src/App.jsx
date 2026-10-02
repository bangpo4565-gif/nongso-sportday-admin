import { useState } from 'react'
import AdminTab from './AdminTab'
import RosterTab from './RosterTab'
import PhotoTab from './PhotoTab'
import FlagVoteTab from './FlagVoteTab'
import EntranceVoteTab from './EntranceVoteTab'
import InfoTab from './InfoTab'
import FlagTab from './FlagTab'
import VideoTab from './VideoTab'
import SongTab from './SongTab'
import JudgeTab from './JudgeTab'
import './App.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '11111111'

const TABS = [
  { key: 'admin', label: '점수 입력' },
  { key: 'judges', label: '심판 및 담당자' },
  { key: 'roster', label: '참가신청/학생배정' },
  { key: 'info', label: '공지사항/안내 편집' },
  { key: 'photos', label: '활동 사진' },
  { key: 'flags', label: '학급 깃발 올리기' },
  { key: 'flagvote', label: '깃발 투표 및 순위' },
  { key: 'entrancevote', label: '입장식 투표 및 순위' },
  { key: 'videos', label: '종목 영상 관리' },
  { key: 'songs', label: '노래 신청 관리' },
]

function App() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [tab, setTab] = useState('admin')

  function submitPassword(e) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError('')
      setPw('')
    } else {
      setPwError('암호가 틀렸어요.')
    }
  }

  if (!authed) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <p className="landing-year">2026학년도</p>
          <h1 className="landing-title">농소중학교 어울림 체육활동 관리자</h1>
          <p className="landing-sub">교사 전용 페이지입니다. 암호를 입력해주세요.</p>
          <form onSubmit={submitPassword} className="pw-form admin-pw-form" style={{ marginTop: 24 }}>
            <input
              type="password"
              placeholder="교사 암호 입력"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
            />
            <button type="submit">들어가기</button>
          </form>
          {pwError && <p className="error">{pwError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div>
            <h1>2026학년도 농소중학교 어울림 체육활동 관리자</h1>
            <p className="subtitle">점수 · 명렬 · 안내 · 사진 · 투표 관리</p>
          </div>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          <button className="tab home-tab" onClick={() => setAuthed(false)}>
            🔒 잠그기
          </button>
        </div>
      </header>

      {tab === 'admin' && <AdminTab />}
      {tab === 'judges' && <JudgeTab />}
      {tab === 'roster' && <RosterTab />}
      {tab === 'info' && <InfoTab allowEdit={true} />}
      {tab === 'photos' && <PhotoTab />}
      {tab === 'flags' && <FlagTab allowUpload={true} />}
      {tab === 'flagvote' && <FlagVoteTab />}
      {tab === 'entrancevote' && <EntranceVoteTab />}
      {tab === 'videos' && <VideoTab allowManage={true} />}
      {tab === 'songs' && <SongTab allowManage={true} />}
    </div>
  )
}

export default App
