// app.jsx — main app, navigation, state

const { useState, useEffect, useRef, useMemo } = React;

const AFLogo = () => (
  <svg viewBox="0 0 28 28">
    <polygon points="14,4 25,24 3,24" fill="none" stroke="#D4A847" strokeWidth="1.6" strokeLinejoin="round"/>
    <line x1="8" y1="18" x2="20" y2="18" stroke="#D4A847" strokeWidth="1.4"/>
    <text x="14" y="20" fontFamily="Montserrat, sans-serif" fontSize="6" fontWeight="700"
          fill="#D4A847" textAnchor="middle" letterSpacing="0.1em">AF</text>
  </svg>
);

const NavIcon = ({ kind }) => {
  const stroke = "currentColor";
  const sw = 1.4;
  if (kind === 'map') return (
    <svg viewBox="0 0 22 22" fill="none">
      <path d="M3 5 L8 3 L14 5 L19 3 L19 17 L14 19 L8 17 L3 19 Z" stroke={stroke} strokeWidth={sw}/>
      <path d="M8 3 L8 17 M14 5 L14 19" stroke={stroke} strokeWidth={sw}/>
    </svg>
  );
  if (kind === 'leads') return (
    <svg viewBox="0 0 22 22" fill="none">
      <line x1="4" y1="6" x2="18" y2="6" stroke={stroke} strokeWidth={sw}/>
      <line x1="4" y1="11" x2="18" y2="11" stroke={stroke} strokeWidth={sw}/>
      <line x1="4" y1="16" x2="18" y2="16" stroke={stroke} strokeWidth={sw}/>
    </svg>
  );
  if (kind === 'pipe') return (
    <svg viewBox="0 0 22 22" fill="none">
      <rect x="3" y="4" width="4" height="14" stroke={stroke} strokeWidth={sw}/>
      <rect x="9" y="4" width="4" height="9" stroke={stroke} strokeWidth={sw}/>
      <rect x="15" y="4" width="4" height="11" stroke={stroke} strokeWidth={sw}/>
    </svg>
  );
  if (kind === 'stats') return (
    <svg viewBox="0 0 22 22" fill="none">
      <path d="M3 17 L8 11 L12 14 L19 5" stroke={stroke} strokeWidth={sw}/>
      <circle cx="19" cy="5" r="1.5" fill={stroke}/>
    </svg>
  );
  if (kind === 'scripts') return (
    <svg viewBox="0 0 22 22" fill="none">
      <rect x="4" y="3" width="14" height="16" stroke={stroke} strokeWidth={sw}/>
      <line x1="7" y1="7" x2="15" y2="7" stroke={stroke} strokeWidth={sw}/>
      <line x1="7" y1="11" x2="15" y2="11" stroke={stroke} strokeWidth={sw}/>
      <line x1="7" y1="15" x2="12" y2="15" stroke={stroke} strokeWidth={sw}/>
    </svg>
  );
  return null;
};

function MapView({ leads, onSelect, selected, t, setTweak }) {
  const [statusFilter, setStatusFilter] = useState(['uncontacted', 'in-progress', 'callback', 'voicemail', 'meeting-booked', 'closed-won']);
  const [typeFilter, setTypeFilter] = useState([]);
  const [minStars, setMinStars] = useState(1);

  const filtered = leads.filter(l =>
    statusFilter.includes(l.status) &&
    l.stars >= minStars &&
    (typeFilter.length === 0 || typeFilter.includes(l.type))
  );

  const counts = {};
  leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });

  return (
    <div className="map-view">
      <div className="map-canvas">
        <window.MapLeaflet
          leads={leads}
          onSelect={onSelect}
          selected={selected}
          t={t} setTweak={setTweak}
          statusFilter={statusFilter}
          minStars={minStars}
          typeFilter={typeFilter}
        />

        {/* Search + filter pill */}
        <div className="map-search">
          <div className="search-pill">
            <span className="ico">⌕</span>
            <span>Manitowoc County · {filtered.length} of {leads.length} pins</span>
          </div>
          <button className={`map-fab`}
                  onClick={() => window.dispatchEvent(new CustomEvent('af-recenter'))}
                  title="Recenter">⌖</button>
        </div>

        {/* Tonight stats overlay */}
        <div className="map-tonight">
          <div>
            <div className="mt-num">{counts['in-progress'] + counts['voicemail'] || 0}</div>
            <div className="mt-lbl">Calls today</div>
          </div>
          <div className="mt-sep"></div>
          <div>
            <div className="mt-num green">{(counts['meeting-booked']||0) + (counts['closed-won']||0)}</div>
            <div className="mt-lbl">Booked</div>
          </div>
          <div className="mt-sep"></div>
          <div>
            <div className="mt-num">{counts['uncontacted'] || 0}</div>
            <div className="mt-lbl">Untouched</div>
          </div>
        </div>
      </div>

      {/* Bottom legend strip */}
      <div className="map-legend">
        {[1,2,3,4,5].map(n => (
          <div key={n} className={`leg-chip ${minStars === n ? 'on' : ''}`}
               onClick={() => setMinStars(n)}>
            <span style={{ color: '#D4A847' }}>{'★'.repeat(n)}</span>+
          </div>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}></div>
        {Object.entries(window.AF_STATUS).map(([k, s]) => {
          const active = statusFilter.includes(k);
          const c = counts[k] || 0;
          return (
            <div key={k} className={`leg-chip ${active ? 'on' : ''}`}
                 onClick={() => setStatusFilter(active ? statusFilter.filter(x => x !== k) : [...statusFilter, k])}>
              <span className="dot" style={{ background: s.color }}></span>
              {s.short} · {c}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhoneApp({ time = '7:42' }) {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);

  // Load lead overrides from localStorage so status/notes persist across sessions
  const LEAD_STATE_KEY = 'af-sales-lead-state';
  const loadLeadOverrides = () => {
    try {
      const saved = localStorage.getItem(LEAD_STATE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  };
  const saveLeadOverrides = (overrides) => {
    try { localStorage.setItem(LEAD_STATE_KEY, JSON.stringify(overrides)); } catch (e) {}
  };

  const [leads, setLeads] = useState(() => {
    const overrides = loadLeadOverrides();
    return window.AF_LEADS.map(l => overrides[l.id] ? { ...l, ...overrides[l.id] } : l);
  });
  const [selected, setSelected] = useState(null);

  const persistLead = (id, patch) => {
    const overrides = loadLeadOverrides();
    overrides[id] = { ...(overrides[id] || {}), ...patch, lastUpdated: Date.now() };
    saveLeadOverrides(overrides);
  };

  const updateStatus = (id, newStatus, userNotes) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus, userNotes } : l));
    persistLead(id, { status: newStatus, userNotes });
    setSelected(null);
  };
  const saveNotes = (id, userNotes) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, userNotes } : l));
    persistLead(id, { userNotes });
  };

  const view = t.view || 'map';
  const setView = (v) => setTweak('view', v);

  return (
    <div className="app">
      <div className="topbar">
        <div className="logo">
          <div className="logo-mark"><AFLogo /></div>
          <div>
            <div className="logo-text">A FUTURE</div>
            <div className="logo-sub">Designed Creatively</div>
          </div>
        </div>
        <div className="greeting">
          <div className="greeting-hi">Up, Drayk.</div>
          <div className="greeting-name">CLOSER MODE · {time}</div>
        </div>
      </div>

      <div className="viewport">
        {view === 'map'    && <div className="view"><MapView leads={leads} onSelect={setSelected} selected={selected} t={t} setTweak={setTweak} /></div>}
        {view === 'leads'  && <div className="view"><window.LeadsListView leads={leads} onSelect={setSelected} /></div>}
        {view === 'pipe'   && <div className="view"><window.PipelineView  leads={leads} onSelect={setSelected} /></div>}
        {view === 'stats'  && <div className="view"><window.StatsView     leads={leads} callsToday={leads.filter(l=>l.status==='in-progress'||l.status==='voicemail').length} /></div>}
        {view === 'scripts'&& <div className="view"><window.ScriptsView /></div>}
      </div>

      <div className="nav">
        {[
          { k: 'map',     l: 'Map' },
          { k: 'leads',   l: 'Leads' },
          { k: 'pipe',    l: 'Pipeline' },
          { k: 'stats',   l: 'Stats' },
          { k: 'scripts', l: 'Scripts' },
        ].map(n => (
          <button key={n.k} className={`nav-btn ${view === n.k ? 'on' : ''}`}
                  onClick={() => setView(n.k)}>
            <span className="nav-icon"><NavIcon kind={n.k} /></span>
            <span className="nav-lbl">{n.l}</span>
          </button>
        ))}
      </div>

      {selected && (
        <window.LeadDrawer lead={selected}
                           onClose={() => setSelected(null)}
                           onUpdateStatus={updateStatus}
                           onSaveNotes={saveNotes} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Production App — fullscreen PhoneApp, no preview frame
// ─────────────────────────────────────────────────────────────
function App() {
  return <PhoneApp time={new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(AM|PM)/i, '')} />;
}

ReactDOM.createRoot(document.getElementById('stage')).render(<App />);
