import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer
} from 'recharts';

function RULChart({ cells }) {
  const data = cells.map(c => ({
    name:     c.label,
    rul:      c.rulMonths > 200 ? 200 : c.rulMonths,
    rulLabel: c.rulMonths > 200 ? '>200 months' : `${c.rulMonths} mo`,
    color:    c.color,
    status:   c.status,
  }));

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 14, padding: '20px 16px',
    }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>
        Estimated RUL — months to end of life
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Based on linear extrapolation of capacity fade rate · EOL = 80% of each cell's initial capacity
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, bottom: 0, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 210]}
            tickFormatter={v => v >= 200 ? '>200' : `${v}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            label={{ value: 'Months', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 11, fill: '#374151' }}
          />
          <Tooltip
            formatter={(v, _, props) => [props.payload.rulLabel, 'Est. RUL']}
          />
          <Bar dataKey="rul" radius={[0, 6, 6, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RULChart;