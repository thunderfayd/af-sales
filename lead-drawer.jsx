// LeadDrawer.jsx — slide-up call screen

function StarRow({ n, accent = '#D4A847' }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? accent : 'rgba(255,255,255,0.18)' }}>★</span>
      ))}
    </span>
  );
}

function Section({ title, open, setOpen, children, badge }) {
  return (
    <div className={`sect ${open ? 'open' : ''}`}>
      <button className="sect-hd" onClick={() => setOpen(!open)}>
        <span className="sect-title">{title}</span>
        {badge && <span className="sect-badge">{badge}</span>}
        <span className="sect-chev">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="sect-body">{children}</div>}
    </div>
  );
}

function LeadDrawer({ lead, onClose, onUpdateStatus, onSaveNotes, accent = '#D4A847' }) {
  const [openSect, setOpenSect] = React.useState('hook');
  const [notes, setNotes] = React.useState(lead.userNotes || '');
  const [callStartedAt, setCallStartedAt] = React.useState(null);
  const status = window.AF_STATUS[lead.status];
  const typeMeta = window.AF_TYPES[lead.type];
  const script = window.AF_SCRIPTS[lead.type] || window.AF_SCRIPTS.restaurant;

  React.useEffect(() => {
    setNotes(lead.userNotes || '');
    setCallStartedAt(null);
    setOpenSect('hook');
  }, [lead.id]);

  const fillScript = (s) => s.replace(/\[BUSINESS\]/g, lead.name).replace(/\[REVIEWS\]/g, lead.reviews);

  const startCall = () => {
    setCallStartedAt(Date.now());
    window.location.href = `tel:${lead.phone.replace(/[^\d]/g, '')}`;
  };

  const setOutcome = (newStatus) => {
    onUpdateStatus(lead.id, newStatus, notes);
  };

  return (
    <div className="drawer-wrap" onClick={(e) => { if (e.target.classList.contains('drawer-wrap')) onClose(); }}>
      <div className="drawer">
        <div className="drawer-grab" />
        <button className="drawer-x" onClick={onClose}>×</button>

        {/* TOP — business header */}
        <div className="dr-top">
          <div className="dr-type-tag"><span>{typeMeta.icon}</span>{typeMeta.label.toUpperCase()}</div>
          <h2 className="dr-name">{lead.name}</h2>
          <div className="dr-meta">
            <StarRow n={lead.stars} accent={accent} />
            <span className="dr-rating">{lead.rating.toFixed(1)} ★ Google · {lead.reviews} reviews</span>
          </div>
          <div className="dr-status-row">
            <span className="dr-pill" style={{ background: status.color, color: '#0A0A0A' }}>{status.label}</span>
            {lead.priority && <span className="dr-pill priority">★ HIGH PRIORITY</span>}
          </div>
          <div className="dr-addr">
            <span>{lead.address}</span>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(lead.address)}`} target="_blank" rel="noreferrer">Open in Maps ↗</a>
          </div>

          <div className="dr-sell">
            <div className="dr-sell-lbl">SELL</div>
            <div className="dr-sell-txt">{lead.sell}</div>
          </div>

          <div className="dr-research">
            <div className="dr-sell-lbl">RESEARCH</div>
            <div className="dr-sell-txt">{lead.notes}</div>
          </div>

          <button className="dr-call" onClick={startCall}>
            <span className="dr-call-ph">☏</span>
            <span>
              <div className="dr-call-lbl">CALL NOW</div>
              <div className="dr-call-num">{lead.phone}</div>
            </span>
          </button>
          {callStartedAt && (
            <div className="dr-timer">● Call started {new Date(callStartedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
          )}
        </div>

        {/* MIDDLE — script */}
        <div className="dr-script">
          <div className="dr-script-hd">SCRIPT — {typeMeta.label.toUpperCase()}</div>

          <Section title="① Hook" open={openSect === 'hook'} setOpen={(v) => setOpenSect(v ? 'hook' : '')}>
            <p className="script-text">{fillScript(script.hook)}</p>
          </Section>

          <Section title="② Transition" open={openSect === 'trans'} setOpen={(v) => setOpenSect(v ? 'trans' : '')}>
            <p className="script-text">{fillScript(script.transition)}</p>
          </Section>

          <Section title="③ The Ask" open={openSect === 'ask'} setOpen={(v) => setOpenSect(v ? 'ask' : '')} badge="15 MIN">
            <p className="script-text">{fillScript(script.ask)}</p>
            <div className="rules">
              <div className="rule">⚠ Never say "AI" — always "virtual receptionist"</div>
              <div className="rule">→ Always ask for 15 minutes, never longer</div>
            </div>
          </Section>

          <Section title="④ Objections" open={openSect === 'obj'} setOpen={(v) => setOpenSect(v ? 'obj' : '')} badge={`${script.objections.length}`}>
            {script.objections.map((o, i) => (
              <div key={i} className="obj">
                <div className="obj-q">"{o.q}"</div>
                <div className="obj-a">{fillScript(o.a)}</div>
              </div>
            ))}
          </Section>

          <Section title="⑤ Pricing reference" open={openSect === 'price'} setOpen={(v) => setOpenSect(v ? 'price' : '')}>
            <div className="price-grid">
              <div className="price-row"><span>Website build</span><span>$300 – $1,500</span></div>
              <div className="price-row sub"><span>+ optional maintenance</span><span>$150/mo</span></div>
              <div className="price-row"><span>VR Tier 01 — After Hours</span><span>$149/mo</span></div>
              <div className="price-row"><span>VR Tier 02 — Overflow</span><span>$249/mo</span></div>
              <div className="price-row"><span>VR Tier 03 — Full Takeover</span><span>$349/mo</span></div>
            </div>
            <a className="cal-link" href="https://calendly.com/ant5ferg/new-meeting" target="_blank" rel="noreferrer">
              calendly.com/ant5ferg/new-meeting ↗
            </a>
          </Section>
        </div>

        {/* NOTES */}
        <div className="dr-notes">
          <div className="dr-script-hd">LIVE NOTES</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => onSaveNotes(lead.id, notes)}
            placeholder="Type while you talk — auto-saves on blur."
            rows={3}
          />
        </div>

        {/* OUTCOME */}
        <div className="dr-outcome">
          <div className="dr-script-hd">OUTCOME</div>
          <div className="outcome-grid">
            <button className="oc oc-win" onClick={() => setOutcome('meeting-booked')}>
              <div className="oc-glyph">✓</div><div>Booked Meeting</div>
            </button>
            <button className="oc" onClick={() => setOutcome('callback')}>
              <div className="oc-glyph">↻</div><div>Callback Req.</div>
            </button>
            <button className="oc" onClick={() => setOutcome('voicemail')}>
              <div className="oc-glyph">◐</div><div>Voicemail</div>
            </button>
            <button className="oc" onClick={() => setOutcome('in-progress')}>
              <div className="oc-glyph">→</div><div>Owner Out</div>
            </button>
            <button className="oc oc-warn" onClick={() => setOutcome('closed-lost')}>
              <div className="oc-glyph">×</div><div>Not Interested</div>
            </button>
            <button className="oc oc-warn" onClick={() => setOutcome('closed-lost')}>
              <div className="oc-glyph">!</div><div>Wrong Number</div>
            </button>
          </div>
        </div>

        <div className="dr-foot">
          <span>Auto-saves locally · synced to leads list</span>
        </div>
      </div>
    </div>
  );
}

window.LeadDrawer = LeadDrawer;
