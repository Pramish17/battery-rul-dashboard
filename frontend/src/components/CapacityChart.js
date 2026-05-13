import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

function CapacityChart({ series, eolCap }) {
  const months = series[0]?.actual.map(p => p.month) || [];

  const chartData = months.map((m, i) => {
    const point = { month: parseFloat(m.toFixed(1)) };
    series.forEach(s => {
      point[s.id] = s.actual[i]?.capacity;
    });
    return point;
  });

  const projMonths = series[0]?.projection.map(p => p.month) || [];
  const projData   = projMonths.map((m, i) => {
    const point = { month: parseFloat(m.toFixed(1)) };
    series.forEach(s => {
      point[`${s.id}_proj`] = s.projection[i]?.capacity;
    });
    return point;
  });

  const combined = [...chartData, ...projData];

  return (
    <div style={{
      background:'#fff', border:'1px solid #e5e7eb',
      borderRadius:14, padding:'20px 16px',
    }}>
      <div style={{ fontWeight:600, fontSize:15, color:'#111827', marginBottom:4 }}>
        Capacity fade over time
      </div>
      <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>
        Solid line = observed data · Dotted line = projected to EOL
      </div>

      {/* Custom legend — one entry per cell only */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:14, marginBottom:14 }}>
        {series.map(s => (
          <div key={s.id} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151' }}>
            <div style={{ width:20, height:3, background:s.color, borderRadius:2 }} />
            {s.label}
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6b7280' }}>
          <div style={{ width:20, height:0, borderTop:'2px dashed #6b7280' }} />
          EOL threshold
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={combined} margin={{ top:5, right:20, bottom:5, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            type="number"
            domain={['auto','auto']}
            tickFormatter={v => `M${Math.round(v)}`}
            tick={{ fontSize:11, fill:'#9ca3af' }}
          />
          <YAxis
            domain={[12, 17.5]}
            tickFormatter={v => `${v.toFixed(1)}`}
            tick={{ fontSize:11, fill:'#9ca3af' }}
            width={45}
          />
          <Tooltip
            formatter={(v, name) => {
              const id   = name.replace('_proj','');
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
            label={{ value:'EOL (12.8 Ah)', position:'insideTopRight', fontSize:11, fill:'#6b7280' }}
          />
          {/* Observed lines */}
          {series.map(s => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r:3, fill:s.color }}
              activeDot={{ r:5 }}
              legendType="none"
              connectNulls={false}
            />
          ))}
          {/* Projected dotted lines */}
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