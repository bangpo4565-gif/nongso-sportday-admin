import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

// Supabase는 한 번에 최대 1000줄까지만 돌려줘서, 배정이 1000건을 넘으면 일부가 화면에서 빠져요.
// 그래서 1000줄씩 나눠서 전부 가져와요.
async function fetchAllAssignments() {
  const pageSize = 1000
  let all = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('event_assignments')
      .select('*')
      .order('id')
      .range(from, from + pageSize - 1)
    if (error) return { data: all, error }
    all = all.concat(data || [])
    if (!data || data.length < pageSize) break
  }
  return { data: all, error: null }
}

function studentNo(s) {
  // 학번 형식: 학년 + 반(2자리) + 번호(2자리). 예) 1학년 9반 15번 -> 10915
  return `${s.grade}${String(s.class_no).padStart(2, '0')}${String(s.number).padStart(2, '0')}`
}

export default function SearchTab() {
  const [students, setStudents] = useState([])
  const [events, setEvents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      const [s, e, a] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('events').select('*').order('sort_order'),
        fetchAllAssignments(),
      ])
      if (s.error) setLoadError('학생 명렬을 불러오지 못했어요.')
      setStudents(s.data || [])
      setEvents(e.data || [])
      setAssignments(a.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().replace(/\s/g, '')
    if (!q) return []
    return students
      .filter((s) => s.name.includes(q) || studentNo(s).includes(q))
      .slice(0, 30)
  }, [students, query])

  function eventsFor(studentId) {
    const ids = new Set(assignments.filter((a) => a.student_id === studentId).map((a) => a.event_id))
    return events.filter((e) => ids.has(e.id))
  }

  return (
    <div>
      <section className="panel narrow">
        <h2>내 참가종목 확인</h2>
        <p className="status-text">학번 또는 이름을 입력하면 어떤 종목에 참가하는지 바로 보여줘요.</p>
        <input
          className="search-input"
          type="text"
          placeholder="학번 또는 이름 입력 (예: 10915 또는 홍길동)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loadError && <p className="error">{loadError}</p>}
      </section>

      {loading && <p className="status-text">불러오는 중...</p>}

      {!loading && query.trim() && (
        <section className="panel">
          {results.length === 0 && <p className="status-text">일치하는 학생이 없어요.</p>}
          <div className="search-results">
            {results.map((s) => {
              const evs = eventsFor(s.id)
              return (
                <div key={s.id} className="search-result-row">
                  <div className="search-result-name">
                    {s.grade}학년 {s.class_no}반 {s.number}번 {s.name}
                  </div>
                  <div className="search-result-events">
                    {evs.length > 0 ? evs.map((e) => e.name).join(', ') : '아직 배정된 종목이 없어요'}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
