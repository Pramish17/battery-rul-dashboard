function CellCard({ cell }) {
  const statusColors = {
    Critical: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
    Warning:  { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
    Healthy:  { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  };

  const s     = statusColors[cell.status];
  const pct   = Math.min(100, ((cell.endCap - 12.8) / (16.0 - 12.8)) * 100);
  const ruled = cell.rulMonths > 500 ? '> 500 months' : `${cell.rulMonths} months`;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 14,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{cell.label}</div>
        <span style={{
          background: s.bg, color: s.text,
          border: `1px solid ${s.border}`,
          borderRadius: 20, fontSize: 11,
          fontWeight: 600, padding: '2px 10px',
        }}>
          {cell.status}
        </span>
      </div>

      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: cell.color }}>
          {cell.endCap.toFixed(2)} Ah
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Current capacity · SOH {cell.sohEnd}%
        </div>
      </div>

      <div style={{
        background: '#f3f4f6', borderRadius: 6,
        height: 8, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct.toFixed(1)}%`,
          background: cell.color,
          height: '100%',
          borderRadius: 6,
          transition: 'width 0.8s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <div>
          <div style={{ color: '#9ca3af' }}>Strategy</div>
          <div style={{ fontWeight: 600, color: '#374151' }}>{cell.strategy}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af' }}>Est. RUL</div>
          <div style={{ fontWeight: 600, color: '#374151' }}>{ruled}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af' }}>Fade</div>
          <div style={{ fontWeight: 600, color: '#374151' }}>{cell.fadePct}%</div>
        </div>
      </div>
    </div>
  );
}

export default CellCard;