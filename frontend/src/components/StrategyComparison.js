const STRATEGIES = ['BMP', 'BMR', 'SPM'];
const STRATEGY_COLORS = { BMP: '#1d4ed8', BMR: '#b91c1c', SPM: '#15803d' };
const STRATEGY_NAMES  = {
  BMP: 'Battery-friendly profit optimisation',
  BMR: 'Revenue-first, battery-damaging',
  SPM: 'Physics-guided, most battery-friendly',
};
const STRATEGY_DESC = {
  BMP: 'Cautious trading — limits depth of discharge and current rate. Slower revenue but much longer battery life.',
  BMR: 'Aggressive full-range cycling at peak current. Maximises short-term revenue at the cost of rapid battery degradation.',
  SPM: 'Uses an electrochemical Single Particle Model to avoid internal stress. Lowest fade rate of any strategy tested.',
};

function groupCells(cells) {
  const grouped = {};
  STRATEGIES.forEach(s => {
    const sc = cells.filter(c => c.strategy === s);
    if (!sc.length) return;
    const avgSOH      = sc.reduce((a, c) => a + c.sohEnd, 0) / sc.length;
    const avgFade     = sc.reduce((a, c) => a + c.fadePct, 0) / sc.length;
    const avgFadeRate = sc.reduce((a, c) => a + c.fadePerMonth, 0) / sc.length;
    const validRUL    = sc.filter(c => c.rulMonths < 9999);
    const avgRUL      = validRUL.length ? validRUL.reduce((a, c) => a + c.rulMonths, 0) / validRUL.length : 9999;
    grouped[s] = { avgSOH, avgFade, avgFadeRate, avgRUL, cells: sc };
  });
  return grouped;
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 700, color: '#111827' }}>{value}</span>
    </div>
  );
}

function StrategyComparison({ cells }) {
  const grouped = groupCells(cells);
  const ranked  = [...STRATEGIES]
    .filter(s => grouped[s])
    .sort((a, b) => grouped[b].avgSOH - grouped[a].avgSOH);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
        Physics-guided cycling (SPM) preserves the most battery health — aggressive trading (BMR) destroys it fastest
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Averaged over 2 cells per strategy · RUL estimated by linear extrapolation from observed fade rate
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        {STRATEGIES.filter(s => grouped[s]).map(s => {
          const g      = grouped[s];
          const color  = STRATEGY_COLORS[s];
          const rulLbl = g.avgRUL > 300 ? '>300 mo' : `${g.avgRUL.toFixed(1)} mo`;
          return (
            <div key={s} style={{
              border:     `2px solid ${color}33`,
              borderRadius: 10,
              padding:    '14px 16px',
              background: `${color}0a`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color }}>{s}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{STRATEGY_NAMES[s]}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, marginBottom: 10, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
                {STRATEGY_DESC[s]}
              </div>
              <StatRow label="Avg SOH"   value={`${g.avgSOH.toFixed(1)}%`} />
              <StatRow label="Avg Fade"  value={`${g.avgFade.toFixed(2)}%`} />
              <StatRow label="Avg RUL"   value={rulLbl} />
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                {g.cells.map(c => (
                  <div key={c.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, color: '#9ca3af', padding: '1px 0',
                  }}>
                    <span>{c.label}</span>
                    <span style={{ color: c.status === 'Critical' ? '#dc2626' : c.status === 'Warning' ? '#d97706' : '#16a34a' }}>
                      {c.sohEnd}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '10px 16px', background: '#f9fafb', borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Strategy ranking by average SOH after 12.3 months
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {ranked.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: '#374151' }}>#{i + 1}</span>
              <span style={{
                background: `${STRATEGY_COLORS[s]}1a`,
                color:       STRATEGY_COLORS[s],
                border:      `1px solid ${STRATEGY_COLORS[s]}44`,
                borderRadius: 6, padding: '2px 8px', fontWeight: 600,
              }}>
                {s}
              </span>
              <span style={{ color: '#6b7280' }}>{grouped[s].avgSOH.toFixed(1)}% avg SOH</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StrategyComparison;
