// OtherViews.jsx — Pipeline kanban, Leads list, Stats, Scripts library

function PipelineView({ leads, onSelect, accent = '#D4A847' }) {
  const cols = window.AF_PIPELINE;
  return (
    <div className="pipe">
      <div className="view-hd">
        <h2>PIPELINE</h2>
        <div className="view-sub">Drag-feel kanban · {leads.length} leads</div>
      </div>
      <div className="pipe-scroll">
        {cols.map(col => {
          const items = leads.filter(l => l.status === col.key);
          const meta = window.AF_STATUS[col.key];
          return (
            <div key={col.key} className="pipe-col">
              <div className="pipe-col-hd">
                <span className="dot" style={{ background: meta.color }} />
                <span className="pipe-col-lbl">{col.label}</span>
                <span className="pipe-col-ct">{items.length}</span>
              </div>
              <div className="pipe-col-body">
                {items.length === 0 && <div className="pipe-empty">—</div>}
                {items.map(l => (
                  <div key={l.id} className="pipe-card" onClick={() => onSelect(l)}>
                    <div className="pipe-card-name">{l.name}</div>
                    <div className="pipe-card-meta">
                      <span className="pipe-stars" style={{ color: accent }}>{'★'.repeat(l.stars)}</span>
                      <span className="pipe-type">{window.AF_TYPES[l.type].label}</span>
                    </div>
                    <div className="pipe-card-sell">{l.sell}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadsListView({ leads, onSelect, accent = '#D4A847' }) {
  const [sort, setSort] = React.useState('opportunity');
  const sorted = [...leads].sort((a, b) => {
    if (sort === 'opportunity') return b.stars - a.stars || b.reviews - a.reviews;
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'status') return a.status.localeCompare(b.status);
    if (sort === 'reviews') return b.reviews - a.reviews;
    return 0;
  });
  return (
    <div className="leads">
      <div className="view-hd">
        <h2>LEADS · {leads.length}</h2>
        <div className="leads-sort">
          {['opportunity', 'name', 'status', 'reviews'].map(s => (
            <button key={s} className={sort === s ? 'on' : ''} onClick={() => setSort(s)}>{s}</button>
          ))}
        </div>
      </div>
      <div className="leads-list">
        {sorted.map(l => {
          const st = window.AF_STATUS[l.status];
          return (
            <button key={l.id} className="lead-row" onClick={() => onSelect(l)}>
              <div className="lead-row-l">
                <span className="lead-dot" style={{ background: st.color }} />
                <div>
                  <div className="lead-row-name">{l.name}</div>
                  <div className="lead-row-meta">
                    <span style={{ color: accent }}>{'★'.repeat(l.stars)}</span>
                    <span className="sep">·</span>
                    <span>{window.AF_TYPES[l.type].label}</span>
                    <span className="sep">·</span>
                    <span>{l.reviews} rev</span>
                  </div>
                </div>
              </div>
              <div className="lead-row-r">
                <div className="lead-row-stat">{st.label}</div>
                <div className="lead-row-arrow">›</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatsView({ leads, callsToday, accent = '#D4A847' }) {
  const counts = {};
  leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
  const booked = counts['meeting-booked'] || 0;
  const won = counts['closed-won'] || 0;
  const lost = counts['closed-lost'] || 0;
  const inFlight = (counts['in-progress'] || 0) + (counts['callback'] || 0) + (counts['voicemail'] || 0);
  const untouched = counts['uncontacted'] || 0;
  const contacted = leads.length - untouched;
  const conv = contacted ? Math.round(((booked + won) / contacted) * 100) : 0;

  const oppRemaining = leads.filter(l => l.status === 'uncontacted')
    .reduce((s, l) => s + l.stars, 0);

  return (
    <div className="stats">
      <div className="view-hd">
        <h2>STATS</h2>
        <div className="view-sub">Drayk's territory · this month</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card big">
          <div className="stat-card-num">{callsToday}</div>
          <div className="stat-card-lbl">CALLS TONIGHT</div>
        </div>
        <div className="stat-card big" style={{ borderColor: accent }}>
          <div className="stat-card-num" style={{ color: accent }}>{booked + won}</div>
          <div className="stat-card-lbl">MEETINGS BOOKED</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num">{conv}%</div>
          <div className="stat-card-lbl">CONVERSION</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num">{inFlight}</div>
          <div className="stat-card-lbl">IN FLIGHT</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num">{untouched}</div>
          <div className="stat-card-lbl">UNTOUCHED</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num">{oppRemaining}</div>
          <div className="stat-card-lbl">OPP. STARS LEFT</div>
        </div>
      </div>

      <div className="stats-funnel">
        <div className="stats-funnel-hd">FUNNEL</div>
        {window.AF_PIPELINE.map(stage => {
          const c = counts[stage.key] || 0;
          const pct = leads.length ? (c / leads.length) * 100 : 0;
          return (
            <div key={stage.key} className="funnel-row">
              <span className="funnel-lbl">{stage.label}</span>
              <div className="funnel-bar">
                <div className="funnel-fill" style={{
                  width: `${pct}%`,
                  background: window.AF_STATUS[stage.key].color,
                }} />
              </div>
              <span className="funnel-ct">{c}</span>
            </div>
          );
        })}
      </div>

      <div className="stats-week">
        <div className="stats-funnel-hd">CALLS BY DAY · LAST WEEK</div>
        <div className="week-bars">
          {[
            { d: 'M', n: 8, on: true }, { d: 'T', n: 11, on: true },
            { d: 'W', n: 0, on: false }, { d: 'T', n: 0, on: false },
            { d: 'F', n: 0, on: false }, { d: 'S', n: 14, on: true },
            { d: 'S', n: 9, on: true },
          ].map((day, i) => (
            <div key={i} className={`week-bar ${day.on ? '' : 'off'}`}>
              <div className="week-fill" style={{ height: `${day.n * 5}px`, background: day.on ? accent : 'rgba(255,255,255,0.08)' }} />
              <div className="week-num">{day.n || '—'}</div>
              <div className="week-day">{day.d}</div>
            </div>
          ))}
        </div>
        <div className="week-note">Wed–Fri off (other job)</div>
      </div>
    </div>
  );
}

function ScriptsView({ accent = '#D4A847' }) {
  const [active, setActive] = React.useState('restaurant');
  const script = window.AF_SCRIPTS[active];
  return (
    <div className="scripts">
      <div className="view-hd">
        <h2>SCRIPTS</h2>
        <div className="view-sub">Master library · by business type</div>
      </div>
      <div className="scripts-tabs">
        {Object.entries(window.AF_TYPES).map(([k, t]) => (
          <button key={k} className={active === k ? 'on' : ''} onClick={() => setActive(k)}>
            <span className="ti">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="script-body">
        <div className="script-rules">
          <div className="rule-pill">⚠ Never say "AI" — say "virtual receptionist"</div>
          <div className="rule-pill">→ Always 15 min, never longer</div>
          <div className="rule-pill">★ Lead with "local web developer in Manitowoc"</div>
        </div>
        <div className="script-sect">
          <div className="script-sect-hd">① HOOK</div>
          <div className="script-text">{script.hook}</div>
        </div>
        <div className="script-sect">
          <div className="script-sect-hd">② TRANSITION</div>
          <div className="script-text">{script.transition}</div>
        </div>
        <div className="script-sect">
          <div className="script-sect-hd">③ THE ASK</div>
          <div className="script-text">{script.ask}</div>
        </div>
        <div className="script-sect">
          <div className="script-sect-hd">④ OBJECTIONS</div>
          {script.objections.map((o, i) => (
            <div key={i} className="obj">
              <div className="obj-q">"{o.q}"</div>
              <div className="obj-a">{o.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PipelineView, LeadsListView, StatsView, ScriptsView });
