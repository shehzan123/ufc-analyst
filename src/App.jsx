import { useState, useEffect, useRef } from 'react'

// ─── API helpers ───────────────────────────────────────────────────────────
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc'
const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc'

async function espnFetch(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN ${res.status}`)
  return res.json()
}

async function analyze(prompt) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

// ─── Global styles ─────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Barlow:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red:    #C1121F;
    --red2:   #9B0E18;
    --gold:   #FFB703;
    --bg:     #070707;
    --s1:     #101010;
    --s2:     #161616;
    --s3:     #1C1C1C;
    --bd:     #242424;
    --bd2:    #2E2E2E;
    --tx:     #ECECEC;
    --tx2:    #A0A0A0;
    --mu:     #555;
    --D: 'Bebas Neue', cursive;
    --M: 'Share Tech Mono', monospace;
    --B: 'Barlow', sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--tx);
    font-family: var(--B);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Layout ── */
  .wrap { max-width: 1100px; margin: 0 auto; padding: 0 20px 100px; }

  /* ── Noise overlay ── */
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: .4;
  }
  .wrap { position: relative; z-index: 1; }

  /* ── Header ── */
  .hdr {
    padding: 32px 0 22px;
    border-bottom: 2px solid var(--red);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  .logo { cursor: default; }
  .logo-main {
    font-family: var(--D);
    font-size: clamp(52px, 9vw, 88px);
    line-height: .85;
    letter-spacing: 4px;
    background: linear-gradient(135deg, #fff 60%, #888);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .logo-main em { font-style: normal; -webkit-text-fill-color: var(--red); color: var(--red); }
  .logo-sub {
    font-family: var(--M);
    font-size: 9px;
    letter-spacing: 4px;
    color: var(--mu);
    margin-top: 8px;
    text-transform: uppercase;
  }
  .hdr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
  .live-chip {
    font-family: var(--M);
    font-size: 9px;
    letter-spacing: 2.5px;
    padding: 7px 16px;
    border: 1px solid var(--gold);
    color: var(--gold);
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.15} }
  .powered {
    font-family: var(--M);
    font-size: 8px;
    letter-spacing: 2px;
    color: var(--mu);
  }

  /* ── Nav ── */
  .nav {
    display: flex;
    border-bottom: 1px solid var(--bd);
    margin-top: 36px;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar { display: none; }
  .ntab {
    font-family: var(--D);
    font-size: 18px;
    letter-spacing: 1.5px;
    padding: 13px 30px;
    color: var(--mu);
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -1px;
    background: none;
    cursor: pointer;
    transition: color .15s, border-color .15s;
    white-space: nowrap;
  }
  .ntab:hover { color: var(--tx2); }
  .ntab.on { color: var(--tx); border-bottom-color: var(--red); }

  /* ── Section label ── */
  .lbl {
    font-family: var(--M);
    font-size: 9px;
    letter-spacing: 3px;
    color: var(--mu);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 30px 0 18px;
  }
  .lbl::after { content:''; flex:1; height:1px; background:var(--bd); }

  /* ── Event pills ── */
  .epills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 22px; }
  .epill {
    font-family: var(--M);
    font-size: 9px;
    letter-spacing: 1.5px;
    padding: 7px 16px;
    border: 1px solid var(--bd);
    cursor: pointer;
    background: none;
    color: var(--mu);
    transition: all .15s;
    text-transform: uppercase;
  }
  .epill:hover { border-color: var(--tx2); color: var(--tx2); }
  .epill.on { border-color: var(--red); color: var(--red); background: rgba(193,18,31,.07); }

  /* ── Event info ── */
  .ev-info { margin-bottom: 20px; }
  .ev-name { font-family: var(--D); font-size: clamp(22px, 4vw, 32px); letter-spacing: 1.5px; }
  .ev-meta { font-family: var(--M); font-size: 10px; color: var(--mu); margin-top: 5px; letter-spacing: 1px; }

  /* ── Weight filter ── */
  .wf { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 20px; }
  .wchip {
    font-family: var(--M);
    font-size: 8.5px;
    letter-spacing: 1px;
    padding: 5px 12px;
    border: 1px solid var(--bd);
    cursor: pointer;
    background: none;
    color: var(--mu);
    transition: all .15s;
    text-transform: uppercase;
  }
  .wchip:hover { border-color: var(--bd2); color: var(--tx2); }
  .wchip.on { border-color: var(--red); color: var(--red); background: rgba(193,18,31,.07); }

  /* ── Fight list ── */
  .fight-list { display: flex; flex-direction: column; gap: 2px; }
  .fight {
    background: var(--s1);
    border-left: 3px solid transparent;
    display: grid;
    grid-template-columns: 1fr 96px 1fr;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    transition: background .15s, border-color .15s;
    position: relative;
    user-select: none;
  }
  .fight:hover { background: var(--s2); border-left-color: var(--red); }
  .fight.main-ev { border-left-color: var(--gold); }
  .fight.open { background: var(--s2); border-left-color: var(--red); }
  .fname { font-family: var(--D); font-size: clamp(14px, 2vw, 20px); letter-spacing: .5px; line-height: 1.1; }
  .frec { font-family: var(--M); font-size: 10px; color: var(--mu); margin-top: 3px; }
  .fright { text-align: right; }
  .vs-col { text-align: center; }
  .vs-txt { font-family: var(--D); font-size: 24px; color: var(--red); display: block; }
  .wctxt { font-family: var(--M); font-size: 7.5px; letter-spacing: 1.5px; color: var(--mu); display: block; margin-top: 2px; }
  .main-tag { font-family: var(--M); font-size: 7.5px; letter-spacing: 2px; color: var(--gold); position: absolute; top: 8px; right: 14px; }
  .chevron { position: absolute; bottom: 10px; right: 14px; font-size: 10px; color: var(--mu); transition: transform .2s; }
  .fight.open .chevron { transform: rotate(180deg); }

  /* ── Analysis panel ── */
  .analysis-wrap { background: #0A0A0A; border: 1px solid var(--bd); border-top: none; margin-bottom: 2px; overflow: hidden; }
  .analysis-inner { padding: 24px; }
  .a-hdr {
    font-family: var(--M);
    font-size: 8.5px;
    letter-spacing: 3px;
    color: var(--red);
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .a-hdr span:last-child { color: var(--mu); }
  .a-txt { font-size: 13.5px; line-height: 1.9; white-space: pre-wrap; color: var(--tx); }

  /* Prob bar */
  .bar-wrap { margin: 14px 0 18px; }
  .bar-names { display: flex; justify-content: space-between; font-family: var(--M); font-size: 10px; color: var(--tx2); margin-bottom: 7px; }
  .bar-pct { font-family: var(--M); font-size: 9px; color: var(--mu); }
  .bar-track { height: 5px; background: var(--bd2); }
  .bar-fill { height: 100%; background: linear-gradient(90deg, var(--red), var(--gold)); transition: width 1s cubic-bezier(.23,1,.32,1); }

  /* Loading */
  .loading { display: flex; align-items: center; gap: 12px; padding: 24px; font-family: var(--M); font-size: 11px; color: var(--mu); letter-spacing: 1px; }
  .spin { width: 16px; height: 16px; border: 2px solid var(--bd2); border-top-color: var(--red); border-radius: 50%; animation: spin .65s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Fighter Scout ── */
  .srow { display: flex; margin-bottom: 28px; }
  .sinput {
    flex: 1;
    background: var(--s1);
    border: 1px solid var(--bd);
    border-right: none;
    border-bottom: 2px solid var(--red);
    color: var(--tx);
    font-family: var(--M);
    font-size: 13px;
    padding: 14px 18px;
    outline: none;
    transition: border-color .15s;
  }
  .sinput::placeholder { color: var(--mu); }
  .sinput:focus { border-color: var(--red); }
  .sbtn {
    background: var(--red);
    border: none;
    color: #fff;
    font-family: var(--D);
    font-size: 17px;
    letter-spacing: 1.5px;
    padding: 0 28px;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
  }
  .sbtn:hover { background: var(--red2); }
  .sbtn:disabled { background: var(--bd); color: var(--mu); cursor: not-allowed; }

  .fcard { background: var(--s1); border: 1px solid var(--bd); padding: 24px; margin-bottom: 16px; }
  .fc-name { font-family: var(--D); font-size: clamp(32px, 5vw, 48px); letter-spacing: 1.5px; line-height: 1; }
  .fc-meta { font-family: var(--M); font-size: 10px; color: var(--gold); margin-top: 6px; letter-spacing: 1px; }

  .sgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1px; background: var(--bd); margin: 18px 0; }
  .scell { background: var(--s2); padding: 12px 14px; }
  .scell-l { font-family: var(--M); font-size: 8px; letter-spacing: 2px; color: var(--mu); text-transform: uppercase; margin-bottom: 4px; }
  .scell-v { font-family: var(--D); font-size: 24px; color: var(--gold); line-height: 1; }

  /* ── Ask ── */
  .ask-box { display: flex; margin-bottom: 0; }
  .ainput {
    flex: 1;
    background: var(--s1);
    border: 1px solid var(--bd);
    border-right: none;
    border-bottom: 2px solid var(--red);
    color: var(--tx);
    font-family: var(--B);
    font-size: 14px;
    padding: 14px 18px;
    outline: none;
    resize: none;
    min-height: 54px;
    line-height: 1.5;
  }
  .ainput::placeholder { color: var(--mu); }
  .ainput:focus { border-color: var(--red); }
  .ask-result { background: var(--s1); border: 1px solid var(--bd); border-top: none; padding: 24px; }
  .ask-txt { font-size: 14px; line-height: 1.9; white-space: pre-wrap; }

  /* ── News ── */
  .news-item {
    background: var(--s1);
    border-left: 3px solid var(--bd);
    padding: 13px 18px;
    margin-bottom: 2px;
    transition: border-color .15s, background .15s;
  }
  .news-item:hover { border-left-color: var(--red); background: var(--s2); }
  .news-hl { font-weight: 600; font-size: 13px; line-height: 1.4; }
  .news-meta { font-family: var(--M); font-size: 9px; color: var(--mu); margin-top: 5px; letter-spacing: 1px; }

  /* ── Empty / Error ── */
  .empty { font-family: var(--M); font-size: 11px; color: var(--mu); padding: 28px; text-align: center; border: 1px dashed var(--bd); letter-spacing: 1px; }
  .empty.err { color: var(--red); border-color: rgba(193,18,31,.3); }

  /* ── Footer ── */
  .footer {
    margin-top: 60px;
    padding: 24px 0;
    border-top: 1px solid var(--bd);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .footer-l { font-family: var(--D); font-size: 18px; letter-spacing: 2px; color: var(--mu); }
  .footer-l em { font-style: normal; color: var(--red); }
  .footer-r { font-family: var(--M); font-size: 9px; color: var(--mu); letter-spacing: 1.5px; text-align: right; line-height: 2; }

  /* ── Responsive ── */
  @media (max-width: 580px) {
    .fight { grid-template-columns: 1fr 62px 1fr; padding: 12px 12px; }
    .vs-col { padding: 0; }
    .ntab { padding: 10px 16px; font-size: 16px; }
    .analysis-inner { padding: 16px; }
  }
`

const WCS = ['All','Heavyweight','Light Heavyweight','Middleweight','Welterweight','Lightweight','Featherweight','Bantamweight','Flyweight',"Women's Bantamweight","Women's Flyweight","Women's Strawweight"]

export default function App() {
  const [tab, setTab] = useState('card')
  const [events, setEvents] = useState([])
  const [selEv, setSelEv] = useState(null)
  const [fights, setFights] = useState([])
  const [loadingEvs, setLoadingEvs] = useState(true)
  const [evErr, setEvErr] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [analyses, setAnalyses] = useState({})
  const [loadingA, setLoadingA] = useState({})
  const [wc, setWc] = useState('All')
  const [news, setNews] = useState([])
  // Scout
  const [sq, setSq] = useState('')
  const [scout, setScout] = useState(null)
  const [scoutLoading, setScoutLoading] = useState(false)
  const [scoutErr, setScoutErr] = useState('')
  // Ask
  const [aq, setAq] = useState('')
  const [askRes, setAskRes] = useState('')
  const [askLoading, setAskLoading] = useState(false)

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoadingEvs(true)
    setEvErr('')
    try {
      const data = await espnFetch(`${ESPN_BASE}/scoreboard`)
      const evs = data.events || []
      setEvents(evs)
      if (evs.length) {
        setSelEv(evs[0])
        parseFights(evs[0])
      } else {
        setEvErr('No upcoming events found.')
      }
      try {
        const nd = await espnFetch(`${ESPN_BASE}/news?limit=8`)
        setNews(nd.articles || [])
      } catch (_) {}
    } catch (e) {
      setEvErr('Could not connect to ESPN: ' + e.message)
    } finally {
      setLoadingEvs(false)
    }
  }

  function parseFights(ev) {
    const comps = ev.competitions || []
    const parsed = comps.map(c => {
      const cs = c.competitors || []
      const f1 = cs[0], f2 = cs[1]
      return {
        id: c.id,
        main: c.type?.text?.toLowerCase().includes('main') || false,
        weightclass: c.type?.text || '',
        f1: { name: f1?.athlete?.displayName || 'TBA', record: f1?.athlete?.record || '' },
        f2: { name: f2?.athlete?.displayName || 'TBA', record: f2?.athlete?.record || '' },
      }
    })
    setFights(parsed)
    setExpanded(null)
    setWc('All')
  }

  function pickEvent(ev) {
    setSelEv(ev)
    setAnalyses({})
    parseFights(ev)
  }

  async function toggleFight(fight) {
    if (expanded === fight.id) { setExpanded(null); return }
    setExpanded(fight.id)
    if (analyses[fight.id]) return
    setLoadingA(p => ({ ...p, [fight.id]: true }))
    try {
      const prompt = `You are an elite UFC analyst. Give a sharp, detailed pre-fight breakdown.

FIGHT: ${fight.f1.name} (${fight.f1.record}) vs ${fight.f2.name} (${fight.f2.record})
WEIGHT CLASS: ${fight.weightclass}
${fight.main ? '⭐ THIS IS THE MAIN EVENT' : ''}

Structure your response with these exact sections:

STYLES & MATCHUP
How their styles clash. Who has the stylistic advantage and why.

STRENGTHS & WEAPONS
Top attributes for each fighter that are relevant in this fight.

KEY FACTORS
2-3 decisive things that will determine who wins.

PREDICTION
Who wins, by what method (KO/TKO/Submission/Decision), and what round if applicable. State your confidence as a percentage.

Be direct, opinionated, and analytical. No filler sentences.`

      const text = await analyze(prompt)
      const m = text.match(/(\d{1,3})\s*%/)
      const prob = m ? Math.min(92, Math.max(8, parseInt(m[1]))) : 55
      setAnalyses(p => ({ ...p, [fight.id]: { text, prob, f1: fight.f1.name, f2: fight.f2.name } }))
    } catch (e) {
      setAnalyses(p => ({ ...p, [fight.id]: { text: '⚠ ' + e.message, prob: 50, f1: fight.f1.name, f2: fight.f2.name } }))
    } finally {
      setLoadingA(p => ({ ...p, [fight.id]: false }))
    }
  }

  async function doScout() {
    if (!sq.trim()) return
    setScoutLoading(true)
    setScout(null)
    setScoutErr('')
    try {
      let fighterInfo = { name: sq.trim() }
      try {
        const data = await espnFetch(`${ESPN_BASE}/athletes?search=${encodeURIComponent(sq.trim())}&limit=3`)
        const items = data.items || data.athletes || []
        if (items.length) {
          const ref = items[0].$ref || ''
          const idMatch = ref.match(/\/athletes\/(\d+)/)
          if (idMatch) {
            const full = await espnFetch(`${ESPN_CORE}/athletes/${idMatch[1]}`)
            fighterInfo = {
              name: full.displayName || sq.trim(),
              record: full.record?.items?.[0]?.summary || '',
              wclass: full.weightClass?.text || '',
              age: full.age || '',
              nationality: full.citizenship || '',
              wins: full.record?.items?.[0]?.wins || '',
              losses: full.record?.items?.[0]?.losses || '',
            }
          }
        }
      } catch (_) {}

      const prompt = `You are a UFC analyst. Give a comprehensive scouting report on ${fighterInfo.name}.
${fighterInfo.record ? `Record: ${fighterInfo.record}` : ''}
${fighterInfo.wclass ? `Weight class: ${fighterInfo.wclass}` : ''}
${fighterInfo.age ? `Age: ${fighterInfo.age}` : ''}

FIGHTING STYLE
Primary discipline, preferred path to victory, tendencies.

STRENGTHS
Top 3 attributes that make them dangerous or effective.

WEAKNESSES
Top 2 exploitable gaps.

CURRENT FORM & TRAJECTORY
Recent momentum, any injuries or layoffs, where they're headed.

DIVISION STANDING
Where they rank right now and ideal/nightmare matchups.

Direct and specific. No filler.`

      const analysis = await analyze(prompt)
      setScout({ ...fighterInfo, analysis })
    } catch (e) {
      setScoutErr('Scout failed: ' + e.message)
    } finally {
      setScoutLoading(false)
    }
  }

  async function doAsk() {
    if (!aq.trim()) return
    setAskLoading(true)
    setAskRes('')
    try {
      const text = await analyze(`You are a world-class UFC analyst with deep knowledge of every fighter, division, and matchup. Answer this question with genuine insight and directness:\n\n${aq}`)
      setAskRes(text)
    } catch (e) {
      setAskRes('Error: ' + e.message)
    } finally {
      setAskLoading(false)
    }
  }

  const filtered = fights.filter(f => wc === 'All' || f.weightclass.toLowerCase().includes(wc.toLowerCase()))

  return (
    <>
      <style>{STYLES}</style>
      <div className="wrap">

        {/* Header */}
        <header className="hdr">
          <div className="logo">
            <div className="logo-main"><em>UFC</em> ANALYST</div>
            <div className="logo-sub">AI-Powered Fight Intelligence</div>
          </div>
          <div className="hdr-right">
            <div className="live-chip"><span className="dot" />ESPN Live Data</div>
            <div className="powered">Powered by Claude AI</div>
          </div>
        </header>

        {/* Nav */}
        <nav className="nav">
          {[['card','Fight Card'],['scout','Fighter Scout'],['ask','Ask Analyst']].map(([id, lbl]) => (
            <button key={id} className={`ntab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </nav>

        {/* ── FIGHT CARD ── */}
        {tab === 'card' && (
          <>
            <div className="lbl">Upcoming Events</div>
            {loadingEvs && <div className="loading"><div className="spin" />Connecting to ESPN...</div>}
            {evErr && <div className="empty err">{evErr}</div>}

            <div className="epills">
              {events.map(ev => (
                <button key={ev.id} className={`epill ${selEv?.id === ev.id ? 'on' : ''}`} onClick={() => pickEvent(ev)}>
                  {ev.shortName || ev.name}
                </button>
              ))}
            </div>

            {selEv && (
              <div className="ev-info">
                <div className="ev-name">{selEv.name}</div>
                <div className="ev-meta">
                  {selEv.date ? new Date(selEv.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  {selEv.venues?.[0] ? ` — ${selEv.venues[0].fullName}` : ''}
                </div>
              </div>
            )}

            <div className="wf">
              {['All','Heavyweight','Light Heavyweight','Middleweight','Welterweight','Lightweight','Featherweight','Bantamweight','Flyweight'].map(w => (
                <button key={w} className={`wchip ${wc === w ? 'on' : ''}`} onClick={() => setWc(w)}>
                  {w === 'All' ? 'All Classes' : w}
                </button>
              ))}
            </div>

            <div className="lbl">Fight Card — tap a bout for AI analysis</div>

            <div className="fight-list">
              {filtered.map(fight => {
                const isOpen = expanded === fight.id
                const an = analyses[fight.id]
                return (
                  <div key={fight.id}>
                    <div
                      className={`fight ${fight.main ? 'main-ev' : ''} ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleFight(fight)}
                    >
                      {fight.main && <span className="main-tag">MAIN EVENT</span>}
                      <div>
                        <div className="fname">{fight.f1.name}</div>
                        <div className="frec">{fight.f1.record}</div>
                      </div>
                      <div className="vs-col">
                        <span className="vs-txt">VS</span>
                        <span className="wctxt">{fight.weightclass?.replace(/weight$/i, '').trim().toUpperCase().slice(0, 10)}</span>
                      </div>
                      <div className="fright">
                        <div className="fname">{fight.f2.name}</div>
                        <div className="frec">{fight.f2.record}</div>
                      </div>
                      <span className="chevron">▼</span>
                    </div>

                    {isOpen && (
                      <div className="analysis-wrap">
                        {loadingA[fight.id] ? (
                          <div className="loading"><div className="spin" />Analyzing matchup...</div>
                        ) : an ? (
                          <div className="analysis-inner">
                            <div className="a-hdr">
                              <span>AI Fight Analysis</span>
                              <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                            <div className="bar-wrap">
                              <div className="bar-names">
                                <span>{an.f1}</span>
                                <div className="bar-pct">{an.prob}% — {100 - an.prob}%</div>
                                <span>{an.f2}</span>
                              </div>
                              <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${an.prob}%` }} />
                              </div>
                            </div>
                            <div className="a-txt">{an.text}</div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
              {!loadingEvs && filtered.length === 0 && (
                <div className="empty">No bouts found{wc !== 'All' ? ` for ${wc}` : ''}.</div>
              )}
            </div>

            {news.length > 0 && (
              <>
                <div className="lbl">Latest UFC News</div>
                {news.slice(0, 6).map((a, i) => (
                  <div key={i} className="news-item">
                    <div className="news-hl">{a.headline}</div>
                    <div className="news-meta">
                      {a.published ? new Date(a.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      {' · ESPN UFC'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── FIGHTER SCOUT ── */}
        {tab === 'scout' && (
          <>
            <div className="lbl">Fighter Intelligence</div>
            <div className="srow">
              <input
                className="sinput"
                placeholder="Search any fighter name — Jon Jones, Islam Makhachev, Valentina..."
                value={sq}
                onChange={e => setSq(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doScout()}
              />
              <button className="sbtn" onClick={doScout} disabled={scoutLoading || !sq.trim()}>
                {scoutLoading ? '…' : 'Scout'}
              </button>
            </div>
            {scoutErr && <div className="empty err">{scoutErr}</div>}
            {scout && (
              <div className="fcard">
                <div className="fc-name">{scout.name}</div>
                <div className="fc-meta">
                  {[scout.record, scout.wclass, scout.age ? `Age ${scout.age}` : '', scout.nationality].filter(Boolean).join(' · ')}
                </div>
                {(scout.wins !== '' || scout.losses !== '') && (
                  <div className="sgrid">
                    {[['Wins', scout.wins], ['Losses', scout.losses], ['Division', scout.wclass || '—'], ['Age', scout.age || '—']].map(([l, v]) => (
                      <div className="scell" key={l}>
                        <div className="scell-l">{l}</div>
                        <div className="scell-v" style={{ fontSize: l === 'Division' ? 14 : 24 }}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="a-hdr" style={{ marginTop: 20, marginBottom: 14 }}>
                  <span>AI Scout Report</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="a-txt">{scout.analysis}</div>
              </div>
            )}
          </>
        )}

        {/* ── ASK ANALYST ── */}
        {tab === 'ask' && (
          <>
            <div className="lbl">Ask the AI Analyst</div>
            <div className="ask-box">
              <textarea
                className="ainput"
                rows={2}
                placeholder="Who wins at 185 right now? Is Jones still the GOAT? Break down Makhachev vs Poirier..."
                value={aq}
                onChange={e => setAq(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doAsk() } }}
              />
              <button className="sbtn" onClick={doAsk} disabled={askLoading || !aq.trim()}>
                {askLoading ? '…' : 'Ask'}
              </button>
            </div>
            {askLoading && <div className="loading"><div className="spin" />Analyzing...</div>}
            {askRes && (
              <div className="ask-result">
                <div className="a-hdr">
                  <span>Analysis</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="ask-txt">{askRes}</div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="footer">
          <div className="footer-l"><em>UFC</em> ANALYST</div>
          <div className="footer-r">
            LIVE DATA: ESPN UFC API<br />
            AI ANALYSIS: CLAUDE SONNET<br />
            FOR ENTERTAINMENT PURPOSES
          </div>
        </footer>

      </div>
    </>
  )
}
