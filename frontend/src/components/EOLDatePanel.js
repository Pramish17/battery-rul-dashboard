import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function urgencyColor(rulMonths) {
  if (rulMonths < 12) return '#dc2626';
  if (rulMonths < 36) return '#d97706';
  return '#16a34a';
}

function EOLDatePanel({ cells }) {
  const CAP = 80;
  const sorted = [...cells].sort((a, b) => a.rulMonths - b.rulMonths);

  const chartData = sorted.map(c => ({
    name:   c.label,
    rul:    Math.min(c.rulMonths, CAP),
    rulRaw: c.rulMonths,
    noEOL: c.rulMonths >= 9999,
    color:  c.color,
    status: c.status,
    sohEnd: c.sohEnd,
  }));

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
        BMR cells reach their end-of-life threshold after ~17–18 months from experiment start — BMP and SPM cells do not reach end-of-life within the horizon
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Full-trajectory linear fit · EOL = 80% of each cell's initial capacity C(0) · months total life from experiment start
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'stretch' }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, bottom: 35, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, CAP + 5]}
              tickFormatter={v => v >= CAP ? `>${CAP}` : String(v)}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{ value: 'Months total life (from start)', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={85}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip
              formatter={(_, __, props) => {
                const d = props.payload;
                const label = d.noEOL ? 'No EOL within horizon' : d.rulRaw >= CAP ? `>${CAP} months total life` : `${d.rulRaw.toFixed(1)} months total life`;
                return [label, 'Total predicted life'];
              }}
            />
            <Bar dataKey="rul" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(c => {
            const uc          = urgencyColor(c.rulMonths);
            const borderColor = c.rulMonths < 12 ? '#fca5a5' : c.rulMonths < 36 ? '#fcd34d' : '#e5e7eb';
            const bg          = c.rulMonths < 12 ? '#fef2f2' : c.rulMonths < 36 ? '#fffbeb' : '#f9fafb';
            const rulLabel    = c.rulMonths >= 9999 ? 'No EOL within horizon' : c.rulMonths >= CAP ? `>${CAP} months total life` : `${c.rulMonths.toFixed(1)} months total life`;
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                background: bg,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#111827' }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>SOH {c.sohEnd}% · C(0) = {c.c0} Ah</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: uc }}>{rulLabel}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>months total life</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EOLDatePanel;
