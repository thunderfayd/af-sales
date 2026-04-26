// LegendPanel.jsx — side legend for map

function LegendPanel({ leads, statusFilter, setStatusFilter, typeFilter, setTypeFilter, minStars, setMinStars, showHeatmap, setShowHeatmap, callsToday, meetingsThisWeek, accent = '#D4A847' }) {
  const counts = {};
  leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
  const total = leads.length;
  const booked = (counts['meeting-booked'] || 0) + (counts['closed-won'] || 0);
  const conv = total ? Math.round((booked / total) * 100) : 0;

  return (
    <div className="legend">
      <div className="legend-block">
        <div className="legend-title">TONIGHT</div>
        <div className="stat-row">
          <div><div className="stat-num">{callsToday}</div><div className="stat-lbl">Calls today</div></div>
          <div><div className="stat-num">{meetingsThisWeek}</div><div className="stat-lbl">Meetings / wk</div></div>
          <div><div className="stat-num">{conv}<span className="pct">%</span></div><div className="stat-lbl">Conv rate</div></div>
        </div>
      </div>

      <div className="legend-block">
        <div className="legend-title">STATUS</div>
        {Object.entries(window.AF_STATUS).map(([k, s]) => {
          const c = counts[k] || 0;
          const active = statusFilter.includes(k);
          return (
            <div key={k} className={`legend-row ${active ? 'on' : ''}`}
                 onClick={() => setStatusFilter(active ? statusFilter.filter(x => x !== k) : [...statusFilter, k])}>
              <span className="dot" style={{ background: s.color }} />
              <span className="lbl">{s.label}</span>
              <span className="ct">{c}</span>
            </div>
          );
        })}
      </div>

      <div className="legend-block">
        <div className="legend-title">OPPORTUNITY</div>
        <div className="opp-slider">
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`opp-btn ${minStars <= n ? 'on' : ''}`}
                    onClick={() => setMinStars(n)}>
              <span className="opp-stars">{'★'.repeat(n)}</span>
            </button>
          ))}
        </div>
        <div className="opp-key">
          <div><span style={{ color: accent }}>★</span> low — has site, smooth ops</div>
          <div><span style={{ color: accent }}>★★★</span> mid — VR upsell target</div>
          <div><span style={{ color: accent }}>★★★★★</span> high — no site, busy phone, solo</div>
        </div>
      </div>

      <div className="legend-block">
        <div className="legend-title">TYPE</div>
        <div className="type-grid">
          {Object.entries(window.AF_TYPES).map(([k, t]) => {
            const active = typeFilter.includes(k);
            return (
              <button key={k} className={`type-pill ${active ? 'on' : ''}`}
                      onClick={() => setTypeFilter(active ? typeFilter.filter(x => x !== k) : [...typeFilter, k])}>
                <span className="ti">{t.icon}</span>{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="legend-block">
        <label className="heat-toggle">
          <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} />
          <span className="heat-track"><span className="heat-thumb" /></span>
          <span>Opportunity heatmap</span>
        </label>
      </div>
    </div>
  );
}

window.LegendPanel = LegendPanel;
