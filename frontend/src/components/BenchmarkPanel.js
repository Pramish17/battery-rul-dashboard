import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { OXFORD_RMSE, MODELS, MODEL_DESCRIPTIONS, MODEL_COLORS } from '../data';

function BenchmarkPanel() {
  const meanData = MODELS.map(m => ({
    model: m,
    rmse: OXFORD_RMSE.mean[m],
    color: MODEL_COLORS[m],
  })).sort((a, b) => a.rmse - b.rmse);

  const perCellData = Object.keys(OXFORD_RMSE.perCell).map(cellId => {
    const row = OXFORD_RMSE.perCell[cellId];
    return { cell: cellId, ...row };
  });

  return (
    <div>
      {/* Mean RMSE — horizontal bar chart */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
          Polynomial regression is the best overall model on Oxford data — but Random Forest is catastrophic on fast cells
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
          Mean RMSE (Ah) across all 6 Oxford cells — lower is better · computed by 5-fold cross-validation
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={meanData} layout="vertical" margin={{ top: 0, right: 70, bottom: 35, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 0.45]}
              tickFormatter={v => v.toFixed(2)}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{ value: 'RMSE (Ah) — lower is better', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              type="category"
              dataKey="model"
              width={110}
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
          {meanData.map((d, i) => (
            <div key={d.model} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: '#6b7280', minWidth: 18 }}>#{i + 1}</span>
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
                {d.model}
              </span>
              <span style={{ color: '#6b7280', lineHeight: 1.45 }}>{MODEL_DESCRIPTIONS[d.model]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-cell RMSE table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
          Linear wins on slow cells (BMP, SPM) but fails badly on fast cells (BMR)
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
          Per-cell RMSE (Ah) — winning model per cell highlighted · BMR = fast degradation, BMP/SPM = slow
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
                const vals = MODELS.map(m => row[m]);
                const best = Math.min(...vals);
                const worst = Math.max(...vals);
                return (
                  <tr key={row.cell} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: '#374151' }}>{row.cell}</td>
                    {MODELS.map(m => {
                      const isBest  = row[m] === best;
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
                  const bestMean = Math.min(...MODELS.map(mm => OXFORD_RMSE.mean[mm]));
                  const isBest = OXFORD_RMSE.mean[m] === bestMean;
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
        <div style={{ marginTop: 12, fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
          Oxford Energy Trading Battery Degradation Dataset — Reniers, Mulder &amp; Howey, University of Oxford / EnergyVille, 2020. DOI: 10.5287/bodleian:gJPdDzvP4
        </div>
      </div>
    </div>
  );
}

export default BenchmarkPanel;
