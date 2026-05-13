import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';

function SOHChart({ series }) {
  const months   = series[0]?.actual.map(p => p.month) || [];
  const chartData = months.map((m, i) => {
    const point = { month: parseFloat(m.toFixed(1)) };
    series.forEach(s => {
      point[s.id] = s.actual[i]?.soh;
    });
    return point;
  });

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 14, padding: '20px 16px',
    }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>
        State of Health (SOH) %
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Below 80% = end of life threshold
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={v => `M${Math.round(v)}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            domain={[85, 115]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={45}
          />
          <Tooltip
            formatter={(v, name) => {
              const cell = series.find(s => s.id === name);
              return [`${parseFloat(v).toFixed(1)}%`, cell?.label || name];
            }}
            labelFormatter={v => `Month ${parseFloat(v).toFixed(1)}`}
          />
          <Legend formatter={value => series.find(s => s.id === value)?.label || value} />
          <ReferenceLine
            y={80}
            stroke="#dc2626"
            strokeDasharray="6 3"
            label={{ value: 'EOL 80%', position: 'insideTopRight', fontSize: 11, fill: '#dc2626' }}
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
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SOHChart;