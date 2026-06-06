import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';

function BenchmarkPanel({ cells, benchmark }) {
  if (!benchmark) return null;

  const shortName = label => label.split(' ').slice(-2).join(' ');

  const sohData = cells.map(c => ({
    name:    shortName(c.label),
    label:   c.label,
    value:   c.sohEnd,
    delta:   parseFloat((c.sohEnd - benchmark.baselineSOH).toFixed(1)),
    color:   c.color,
  }));

  const fadeData = cells.map(c => ({
    name:    shortName(c.label),
    label:   c.label,
    value:   c.fadePct,
    delta:   parseFloat((c.fadePct - benchmark.baselineFade).toFixed(2)),
    color:   c.color,
  }));

  const sohMin  = Math.min(benchmark.baselineSOH - 5, ...cells.map(c => c.sohEnd)) - 1;

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>
        Oxford Benchmark Comparison
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        {benchmark.description} — SOH baseline {benchmark.baselineSOH}% · Fade baseline {benchmark.baselineFade}% · Avg RUL {benchmark.baselineRUL} months
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            State of Health vs Baseline
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sohData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#374151' }} />
              <YAxis
                domain={[sohMin, 105]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                width={42}
              />
              <Tooltip
                formatter={(v, _, props) => {
                  const { delta, label } = props.payload;
                  return [`${v}%  (${delta >= 0 ? '+' : ''}${delta}% vs baseline)`, label];
                }}
              />
              <ReferenceLine
                y={benchmark.baselineSOH}
                stroke="#6b7280"
                strokeDasharray="4 2"
                label={{ value: `Baseline ${benchmark.baselineSOH}%`, position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {sohData.map((entry, i) => (
                  <Cell key={i} fill={entry.delta >= 0 ? entry.color : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Capacity Fade % vs Baseline
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fadeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#374151' }} />
              <YAxis
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                width={42}
              />
              <Tooltip
                formatter={(v, _, props) => {
                  const { delta, label } = props.payload;
                  return [`${v}% fade  (${delta >= 0 ? '+' : ''}${delta}% vs baseline)`, label];
                }}
              />
              <ReferenceLine
                y={benchmark.baselineFade}
                stroke="#6b7280"
                strokeDasharray="4 2"
                label={{ value: `Baseline ${benchmark.baselineFade}%`, position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {fadeData.map((entry, i) => (
                  <Cell key={i} fill={entry.delta <= 0 ? entry.color : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dataset citation */}
      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 16, fontStyle: 'italic' }}>
        Oxford Energy Trading Battery Degradation Dataset — Reniers, Mulder &amp; Howey, University of Oxford / EnergyVille, 2020.{' '}
        DOI: 10.5287/bodleian:gJPdDzvP4
      </div>

      {/* Summary table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              {['Cell', 'SOH', 'vs baseline', 'Fade %', 'vs baseline', 'RUL (mo)'].map(h => (
                <th key={h} style={{
                  textAlign: h === 'Cell' ? 'left' : 'right',
                  padding: '6px 8px', color: '#6b7280', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map(c => {
              const sohDelta  = parseFloat((c.sohEnd  - benchmark.baselineSOH).toFixed(1));
              const fadeDelta = parseFloat((c.fadePct - benchmark.baselineFade).toFixed(2));
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8,
                      borderRadius: '50%', background: c.color, marginRight: 6,
                    }} />
                    {c.label}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{c.sohEnd}%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: sohDelta >= 0 ? '#16a34a' : '#dc2626' }}>
                    {sohDelta >= 0 ? '+' : ''}{sohDelta}%
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{c.fadePct}%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: fadeDelta <= 0 ? '#16a34a' : '#dc2626' }}>
                    {fadeDelta >= 0 ? '+' : ''}{fadeDelta}%
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                    {c.rulMonths > 500 ? '>500' : c.rulMonths}
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
              <td style={{ padding: '6px 8px', fontWeight: 600, color: '#374151' }}>Baseline (avg)</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{benchmark.baselineSOH}%</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9ca3af' }}>—</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{benchmark.baselineFade}%</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9ca3af' }}>—</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{benchmark.baselineRUL}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BenchmarkPanel;
