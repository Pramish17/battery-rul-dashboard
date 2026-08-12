import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  OXFORD_RMSE, MODELS, MODEL_DESCRIPTIONS, MODEL_COLORS,
  MODEL_LABELS, BASELINE_MODEL,
} from '../data';

function BenchmarkPanel() {
  let rank = 0;
  const meanData = MODELS.map(m => ({
    model: m,
    label: MODEL_LABELS[m] || m,
    rmse: OXFORD_RMSE.mean[m],
    color: MODEL_COLORS[m],
  }))
    .sort((a, b) => a.rmse - b.rmse)
    .map(d => ({ ...d, rank: d.model === BASELINE_MODEL ? null : ++rank }));

  // Candidate models only - the persistence baseline is excluded from
  // winner highlighting (see table footnote).
  const CANDIDATES = MODELS.filter(m => m !== BASELINE_MODEL);

  const perCellData = Object.keys(OXFORD_RMSE.perCell).map(cellId => {
    const row = OXFORD_RMSE.perCell[cellId];
    return { cell: cellId, ...row };
  });

  return (
    <div>
      {/* Mean RMSE - horizontal bar chart */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
          CNN-LSTM and Polynomial regression are statistically tied for best on Oxford data - but both tree ensembles are catastrophic on fast cells
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
          Mean RMSE (Ah) across all 6 Oxford cells - lower is better · chronological 70/30 train/test split per cell
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={meanData} layout="vertical" margin={{ top: 0, right: 70, bottom: 35, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 0.45]}
              tickFormatter={v => v.toFixed(2)}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{ value: 'RMSE (Ah) - lower is better', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={130}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip
              formatter={(v) => [`${v.toFixed(3)} Ah`, 'Mean RMSE']}
            />
            <Bar dataKey="rmse" radius={[0, 6, 6, 0]}>
              {meanData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Model descriptions */}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {meanData.map(d => (
            <div key={d.model} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: '#6b7280', minWidth: 18 }}>{d.rank ? `#${d.rank}` : '-'}</span>
              <span style={{
                display: 'inline-block',
                background: `${d.color}18`,
                color: d.color,
                border: `1px solid ${d.color}44`,
                borderRadius: 5,
                padding: '1px 8px',
                fontWeight: 700,
                fontSize: 11,
                minWidth: 110,
              }}>
                {d.label}
              </span>
              <span style={{ color: '#6b7280', lineHeight: 1.45 }}>{MODEL_DESCRIPTIONS[d.model]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-cell RMSE table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
          Linear wins the slow BMP cells, CNN-LSTM the SPM cells - every model struggles on fast cells (BMR)
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
          Per-cell RMSE (Ah) - winning model per cell highlighted · BMR = fast degradation, BMP/SPM = slow · chronological 70/30 train/test split per cell
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Cell</th>
                {MODELS.map(m => (
                  <th key={m} style={{ textAlign: 'right', padding: '6px 8px', color: MODEL_COLORS[m], fontWeight: 700 }}>
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perCellData.map(row => {
                const best = Math.min(...CANDIDATES.map(m => row[m]));
                const worst = Math.max(...MODELS.map(m => row[m]));
                return (
                  <tr key={row.cell} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: '#374151' }}>{row.cell}</td>
                    {MODELS.map(m => {
                      const isBest  = m !== BASELINE_MODEL && row[m] === best;
                      const isWorst = row[m] === worst;
                      return (
                        <td key={m} style={{
                          padding: '6px 8px',
                          textAlign: 'right',
                          fontWeight: isBest || isWorst ? 700 : 400,
                          color: isBest ? MODEL_COLORS[m] : isWorst ? '#dc2626' : '#374151',
                          background: isBest ? `${MODEL_COLORS[m]}18` : isWorst ? '#fef2f2' : 'transparent',
                        }}>
                          {row[m].toFixed(3)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700, color: '#374151' }}>Mean</td>
                {MODELS.map(m => {
                  // CNN-LSTM (0.125) and Polynomial (0.138) are a statistical tie -
                  // the gap is smaller than CNN-LSTM's seed-to-seed variability.
                  const isBest = m === 'CNN-LSTM' || m === 'Polynomial';
                  return (
                    <td key={m} style={{
                      padding: '6px 8px', textAlign: 'right',
                      fontWeight: 700,
                      color: isBest ? MODEL_COLORS[m] : '#374151',
                      background: isBest ? `${MODEL_COLORS[m]}18` : 'transparent',
                    }}>
                      {OXFORD_RMSE.mean[m].toFixed(3)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: '#6b7280' }}>
          CNN-LSTM = mean over 5 seeds. Persistence is a baseline, excluded from winner highlighting.
          The Mean row highlights CNN-LSTM and Polynomial as a statistical tie - the 0.013 Ah gap is smaller
          than CNN-LSTM's seed-to-seed variability (sd up to 0.076 Ah on the fast BMR cells).
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
          Oxford Energy Trading Battery Degradation Dataset - Reniers, Mulder &amp; Howey, University of Oxford / EnergyVille, 2020. DOI: 10.5287/bodleian:gJPdDzvP4
        </div>
      </div>
    </div>
  );
}

export default BenchmarkPanel;
