import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function urgencyColor(rulMonths) {
  if (rulMonths < 12)  return '#dc2626';
  if (rulMonths < 24)  return '#d97706';
  return '#16a34a';
}

function EOLDatePanel({ cells }) {
  const sorted = [...cells].sort((a, b) => a.rulMonths - b.rulMonths);

  const chartData = sorted.map(c => ({
    name:   c.label,
    rul:    Math.min(c.rulMonths, 300),
    rulRaw: c.rulMonths,
    color:  c.color,
    status: c.status,
    sohEnd: c.sohEnd,
  }));

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>
        Estimated Remaining Useful Life
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Linear extrapolation from observed fade rate · EOL = 80% of each cell's initial capacity · Months remaining from end of observed data
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 70, bottom: 16, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 320]}
              tickFormatter={v => v >= 300 ? '>300' : String(v)}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{ value: 'Months remaining', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip
              formatter={(_, __, props) => {
                const d = props.payload;
                const label = d.rulRaw > 300 ? '>300 months remaining' : `${d.rulRaw} months remaining`;
                return [label, 'Est. RUL'];
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
            const uc = urgencyColor(c.rulMonths);
            const borderColor = c.rulMonths < 12 ? '#fca5a5' : c.rulMonths < 24 ? '#fcd34d' : '#e5e7eb';
            const bg          = c.rulMonths < 12 ? '#fef2f2' : c.rulMonths < 24 ? '#fffbeb' : '#f9fafb';
            const rulLabel    = c.rulMonths > 300 ? '>300 months' : `${c.rulMonths} months`;
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
                  <div style={{ fontSize: 11, color: '#6b7280' }}>SOH {c.sohEnd}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: uc }}>{rulLabel}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>months remaining</div>
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
