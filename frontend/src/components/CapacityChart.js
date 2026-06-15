import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

function CapacityChart({ series, eolCap }) {
  const months = series[0]?.actual.map(p => p.month) || [];

  const chartData = months.map((m, i) => {
    const point = { month: parseFloat(m.toFixed(1)) };
    series.forEach(s => { point[s.id] = s.actual[i]?.capacity; });
    return point;
  });

  // All projection arrays share the same month steps (built in data.js)
  const projMonths = series[0]?.projection.map(p => p.month) || [];
  const projData = projMonths.map(m => {
    const point = { month: parseFloat(m.toFixed(1)) };
    series.forEach(s => {
      const match = s.projection.find(p => p.month === m);
      if (match) point[`${s.id}_proj`] = match.capacity;
    });
    return point;
  });

  const combined = [...chartData, ...projData];

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
        BMR cells (red) are heading toward end-of-life — BMP and SPM cells remain well above their EOL threshold
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
        Solid line = 13 monthly observations (month 0–12.3) · Dotted line = linear projection to EOL ·
        SOH = C(k) / C(0) × 100% where C(0) is each cell's first measured capacity (~17.2 Ah)
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
        {series.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
            <div style={{ width: 20, height: 3, background: s.color, borderRadius: 2 }} />
            {s.label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
          <div style={{ width: 20, height: 0, borderTop: '2px dashed #6b7280' }} />
          EOL threshold (~80% of each cell's initial capacity)
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={combined} margin={{ top: 5, right: 20, bottom: 14, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            type="number"
            domain={[0, 25]}
            tickFormatter={v => `M${Math.round(v)}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            label={{ value: 'Month', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            domain={[13, 17.5]}
            tickFormatter={v => `${v.toFixed(1)}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={45}
            label={{ value: 'Capacity (Ah)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: '#9ca3af' }}
          />
          <Tooltip
            formatter={(v, name) => {
              const id   = name.replace('_proj', '');
              const cell = series.find(s => s.id === id);
              const tag  = name.includes('_proj') ? ' (projected)' : '';
              return [`${parseFloat(v).toFixed(3)} Ah`, `${cell?.label || name}${tag}`];
            }}
            labelFormatter={v => `Month ${parseFloat(v).toFixed(1)}`}
          />
          <ReferenceLine
            y={eolCap}
            stroke="#6b7280"
            strokeDasharray="6 3"
            label={{ value: `EOL ~${eolCap} Ah (80%)`, position: 'insideTopRight', fontSize: 11, fill: '#6b7280' }}
          />
          {series.map(s => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3, fill: s.color }}
              activeDot={{ r: 5 }}
              legendType="none"
              connectNulls={false}
            />
          ))}
          {series.map(s => (
            <Line
              key={`${s.id}_proj`}
              type="monotone"
              dataKey={`${s.id}_proj`}
              stroke={s.color}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              legendType="none"
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CapacityChart;
