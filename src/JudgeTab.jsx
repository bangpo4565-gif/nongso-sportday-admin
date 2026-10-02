import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// 경기 종목이 아닌, 그 외 담당 업무들 (필요하면 여기에 더 추가하면 돼요)
const DUTY_ROLES = [
  { key: 'broadcast', label: '방송시설' },
  { key: 'first_aid', label: '응급치료' },
  { key: 'cleanup', label: '환경 정화' },
  { key: 'order_patrol', label: '질서 지도 및 순회지도(안전)' },
  { key: 'scoring_tally', label: '순위기록 및 집계' },
]

export default function JudgeTab() {
  const [events, setEvents] = useState([])
  const [judges, setJudges] = useState({}) // event_id -> judge_name
  const [judgeDraft, setJudgeDraft] = useState({}) // event_id -> 입력 중인 값
  const [duties, setDuties] = useState({}) // role_key -> assigned_name
  const [dutyDraft, setDutyDraft] = useState({}) // role_key -> 입력 중인 값
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [savingKey, setSavingKey] = useState('')
  const [message, setMessage] = useState('')

  async function loadAll() {
    setLoading(true)
    setLoadError('')
    const [{ data: eventData, error: eventError }, { data: judgeData }, { data: dutyData }] = await Promise.all([
      supabase.from('events').select('*').order('sort_order'),
      supabase.from('event_judges').select('*'),
      supabase.from('duty_assignments').select('*'),
    ])
    if (eventError) {
      setLoadError('종목 목록을 불러오지 못했어요.')
    }
    setEvents(eventData || [])

    const judgeMap = {}
    ;(judgeData || []).forEach((j) => {
      judgeMap[j.event_id] = j.judge_name || ''
    })
    setJudges(judgeMap)
    setJudgeDraft(judgeMap)

    const dutyMap = {}
    ;(dutyData || []).forEach((d) => {
      dutyMap[d.role_key] = d.assigned_name || ''
    })
    setDuties(dutyMap)
    setDutyDraft(dutyMap)

    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    const channel = supabase
      .channel('judges-duties-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_judges' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_assignments' }, () => loadAll())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function saveJudge(eventId) {
    setSavingKey(eventId)
    setMessage('')
    const name = (judgeDraft[eventId] || '').trim()
    const { error } = await supabase
      .from('event_judges')
      .upsert({ event_id: eventId, judge_name: name, updated_at: new Date().toISOString() }, { onConflict: 'event_id' })
    setSavingKey('')
    if (error) {
      setMessage('저장 중 오류가 났어요: ' + error.message)
    } else {
      setMessage('저장 완료!')
      loadAll()
    }
  }

  async function saveDuty(roleKey) {
    setSavingKey(roleKey)
    setMessage('')
    const name = (dutyDraft[roleKey] || '').trim()
    const { error } = await supabase
      .from('duty_assignments')
      .upsert({ role_key: roleKey, assigned_name: name, updated_at: new Date().toISOString() }, { onConflict: 'role_key' })
    setSavingKey('')
    if (error) {
      setMessage('저장 중 오류가 났어요: ' + error.message)
    } else {
      setMessage('저장 완료!')
      loadAll()
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>🧑‍⚖️ 종목별 심판</h2>
        <p className="status-text" style={{ marginBottom: 14 }}>
          종목마다 심판 선생님 성함을 입력하고 저장하세요. 아직 정하지 않은 종목은 비워두시면 돼요.
        </p>

        {loading && <p className="status-text">불러오는 중...</p>}
        {loadError && <p className="error">{loadError}</p>}
        {!loading && !loadError && events.length === 0 && (
          <p className="status-text">아직 등록된 종목이 없어요.</p>
        )}

        {events.length > 0 && (
          <div className="table-scroll">
            <table className="board">
              <thead>
                <tr>
                  <th>종목</th>
                  <th>심판 성함</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      {ev.name}
                      {ev.participants ? ` (${ev.participants})` : ''}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="search-input"
                        placeholder="심판 성함 입력"
                        value={judgeDraft[ev.id] ?? ''}
                        onChange={(e) => setJudgeDraft((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                        style={{ margin: 0 }}
                      />
                    </td>
                    <td>
                      <button
                        className="save-btn"
                        onClick={() => saveJudge(ev.id)}
                        disabled={savingKey === ev.id || (judgeDraft[ev.id] ?? '') === (judges[ev.id] ?? '')}
                      >
                        {savingKey === ev.id ? '저장 중...' : '저장'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>🙋 기타 담당 업무</h2>
        <p className="status-text" style={{ marginBottom: 14 }}>
          경기 종목 외에 필요한 담당 업무예요. 담당 선생님 성함을 입력하고 저장하세요.
        </p>

        <div className="table-scroll">
          <table className="board">
            <thead>
              <tr>
                <th>담당 업무</th>
                <th>담당 성함</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {DUTY_ROLES.map((role) => (
                <tr key={role.key}>
                  <td>{role.label}</td>
                  <td>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="담당 성함 입력"
                      value={dutyDraft[role.key] ?? ''}
                      onChange={(e) => setDutyDraft((prev) => ({ ...prev, [role.key]: e.target.value }))}
                      style={{ margin: 0 }}
                    />
                  </td>
                  <td>
                    <button
                      className="save-btn"
                      onClick={() => saveDuty(role.key)}
                      disabled={savingKey === role.key || (dutyDraft[role.key] ?? '') === (duties[role.key] ?? '')}
                    >
                      {savingKey === role.key ? '저장 중...' : '저장'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message && <p className="save-message">{message}</p>}
      </section>
    </div>
  )
}
