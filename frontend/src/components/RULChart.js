import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts';

function RULChart({ cells }) {
  const CAP = 80;
  const data = [...cells]
    .sort((a, b) => a.rulMonths - b.rulMonths)
    .map(c => ({
      name:     c.label,
      rul:      Math.min(c.rulMonths, CAP),
      rulLabel: c.rulMonths >= 9999 ? 'No EOL within horizon' : c.rulMonths >= CAP ? `>${CAP} months total life` : `${c.rulMonths.toFixed(1)} months total life`,
      color:    c.color,
    }));

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
        BMR cells have ~17-18 months of total predicted life - BMP and SPM cells are projected to last much longer
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Total predicted life from experiment start · full-trajectory linear fit · EOL = 80% of each cell's initial capacity C(0)
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, bottom: 35, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, CAP + 5]}
            tickFormatter={v => v >= CAP ? `>${CAP}` : `${v}`}
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
