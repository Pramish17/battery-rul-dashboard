import { useState } from 'react';
import MetricCard         from './components/MetricCard';
import CellCard           from './components/CellCard';
import CapacityChart      from './components/CapacityChart';
import SOHChart           from './components/SOHChart';
import RULChart           from './components/RULChart';
import StressAlertsPanel  from './components/StressAlertsPanel';
import DegradationDrivers from './components/DegradationDrivers';
import BenchmarkPanel     from './components/BenchmarkPanel';
import EOLDatePanel       from './components/EOLDatePanel';
import StrategyComparison from './components/StrategyComparison';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, Cell as RCell,
} from 'recharts';
import {
  CELLS, CHART_SERIES, EOL_CAP,
  OXFORD_RMSE, NASA_RMSE,
  MODELS, MODEL_DESCRIPTIONS, MODEL_COLORS,
  NASA_CELLS_DATA, NASA_CHART_DATA,
} from './data';
import './App.css';

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'soh',         label: 'SoH Tracking' },
  { id: 'stress',      label: 'Stress Analysis' },
  { id: 'degradation', label: 'Degradation' },
  { id: 'benchmark',   label: 'Benchmark & EOL' },
  { id: 'nasa',        label: 'NASA & Cross-Dataset' },
];

// ── Shared primitives ──────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 32px',
      display: 'flex',
      gap: 0,
      overflowX: 'auto',
    }}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid #0D2D5E' : '2px solid transparent',
              padding: '14px 20px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#0D2D5E' : '#6b7280',
              cursor: 'pointer',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ChartHeadline({ text }) {
  return (
    <div style={{
      fontSize: 15,
      fontWeight: 700,
      color: '#111827',
      marginBottom: 4,
      lineHeight: 1.35,
    }}>
      {text}
    </div>
  );
}

function ChartSub({ text }) {
  return (
    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>{text}</div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 14,
      padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function InfoCard({ title, children, accent }) {
  return (
    <div style={{
      background: accent ? '#eff6ff' : '#f9fafb',
      border: `1px solid ${accent ? '#bfdbfe' : '#e5e7eb'}`,
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 16,
    }}>
      {title && (
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e3a5f', marginBottom: 8 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Derived summary values ─────────────────────────────────────────────────

const criticalCells = CELLS.filter(c => c.status === 'Critical');
const healthyCells  = CELLS.filter(c => c.status === 'Healthy');
const bmrCells      = CELLS.filter(c => c.strategy === 'BMR');
const spmCells      = CELLS.filter(c => c.strategy === 'SPM');
const avgBMRRate    = bmrCells.reduce((s, c) => s + c.fadePerMonth, 0) / bmrCells.length;
const avgSPMRate    = spmCells.reduce((s, c) => s + c.fadePerMonth, 0) / spmCells.length;
const degradRatio   = (avgBMRRate / avgSPMRate).toFixed(1);
const fastestCell   = [...CELLS].sort((a, b) => a.rulMonths - b.rulMonths)[0];

// ── Tab 1: Overview ────────────────────────────────────────────────────────

function OverviewModule() {
  return (
    <div>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <MetricCard
          label="Critical cells"
          value={criticalCells.length}
          sub="Approaching end of life"
          color="#dc2626"
        />
        <MetricCard
          label="Healthy cells"
          value={healthyCells.length}
          sub="Above 96% SOH"
          color="#16a34a"
        />
        <MetricCard
          label="Fastest degrading"
          value={fastestCell.label}
          sub={`${fastestCell.fadePct}% fade · ${fastestCell.rulMonths.toFixed(1)} months total predicted life`}
          color="#dc2626"
        />
        <MetricCard
          label="BMR vs SPM rate"
          value={`${degradRatio}×`}
          sub="BMR degrades this much faster"
          color="#d97706"
        />
      </div>

      {/* Key findings */}
      <InfoCard title="Key Research Findings" accent>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
          <li>
            <strong>Aggressive trading destroys batteries {degradRatio}× faster.</strong> BMR cells cycle at
            full voltage range and high current; SPM cells use a physics model to stay gentle. After just
            12 months, BMR cells have lost ~15% capacity vs ~2% for SPM.
          </li>
          <li>
            <strong>No single prediction model wins on both datasets.</strong> Polynomial regression is best
            on Oxford (RMSE 0.138 Ah) but ranks 4th on NASA (0.100 Ah). Exponential is best on NASA
            (0.047 Ah) but 3rd on Oxford (0.185 Ah). The right model depends on battery usage patterns.
          </li>
          <li>
            <strong>Random Forest cannot see the future.</strong> It matches patterns in training data but
            catastrophically fails on fast-degrading cells (BMR RMSE up to 0.892 Ah) because it cannot
            extrapolate below its training range.
          </li>
        </ul>
      </InfoCard>

      {/* Cross-dataset summary */}
      <div style={{
        background: '#0D2D5E',
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ color: '#93c5fd', fontSize: 13, fontWeight: 600 }}>
          Cross-Dataset Model Comparison
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Oxford winner', value: 'Polynomial', sub: '0.138 Ah RMSE' },
            { label: 'NASA winner',   value: 'Exponential', sub: '0.047 Ah RMSE' },
            { label: 'Conclusion',    value: 'Regime matters', sub: 'No universal best' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#93c5fd' }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#6ee7b7' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cell cards */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
        Cell health status — all 6 Oxford cells (SOH = C(k) / C(0) × 100%, EOL = 80% of initial)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {CELLS.map(c => <CellCard key={c.id} cell={c} />)}
      </div>
    </div>
  );
}

// ── Tab 2: SoH Tracking ───────────────────────────────────────────────────

function SOHModule() {
  return (
    <div>
      <InfoCard>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>
          <strong>The red lines (BMR cells) are approaching the end-of-life threshold.</strong> Blue (BMP)
          and green (SPM) cells are expected to last many more years at their current fade rate.
          SOH is computed as C(k) / C(0) × 100% where C(0) is each cell's first measured capacity
          (approximately 17.2 Ah), not the 16 Ah nominal. EOL is defined as 80% of each cell's
          individual initial capacity.
        </p>
      </InfoCard>
      <div style={{ marginBottom: 16 }}>
        <CapacityChart series={CHART_SERIES} eolCap={EOL_CAP} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SOHChart series={CHART_SERIES} />
        <RULChart cells={CELLS} />
      </div>
    </div>
  );
}

// ── Tab 3: Stress Analysis ────────────────────────────────────────────────

function StressModule() {
  return (
    <div>
      <InfoCard title="Why do BMR cells wear out faster?">
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>
          BMR cells are pushed harder in every charge-discharge cycle — they charge and discharge across
          the full voltage range (2.58–4.25 V vs 2.67–4.12 V for SPM), draw higher currents (&gt;2C),
          and run hotter. Each of these stresses accelerates lithium plating, electrolyte degradation,
          and particle cracking. The violations below quantify how often limits were exceeded.
        </p>
      </InfoCard>
      <StressAlertsPanel cells={CELLS} />
    </div>
  );
}

// ── Tab 4: Degradation ────────────────────────────────────────────────────

function DegradationModule() {
  return (
    <div>
      <InfoCard title="What do BMP, BMR and SPM mean?">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 4 }}>
          {[
            {
              name: 'BMP', color: '#1d4ed8',
              short: 'Cautious trading — battery-friendly',
              desc: 'Optimises for profit but limits battery stress. Charges and discharges within a moderate voltage window at modest currents.',
            },
            {
              name: 'BMR', color: '#b91c1c',
              short: 'Aggressive trading — revenue-first, battery-damaging',
              desc: 'Maximises trading revenue by pushing the battery to its absolute voltage and current limits every cycle. Causes fastest degradation.',
            },
            {
              name: 'SPM', color: '#15803d',
              short: 'Physics-guided — most battery-friendly',
              desc: 'Uses an electrochemical Single Particle Model to schedule cycles that minimise internal stress. Results in the slowest capacity loss.',
            },
          ].map(s => (
            <div key={s.name} style={{
              borderLeft: `4px solid ${s.color}`,
              paddingLeft: 12,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: s.color }}>{s.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{s.short}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </InfoCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DegradationDrivers cells={CELLS} />
        <StrategyComparison cells={CELLS} />
      </div>
    </div>
  );
}

// ── Tab 5: Benchmark & EOL (Oxford only) ──────────────────────────────────

function BenchmarkModule() {
  return (
    <div>
      <BenchmarkPanel />
      <div style={{ marginTop: 20 }}>
        <EOLDatePanel cells={CELLS} />
      </div>
    </div>
  );
}

// ── Tab 6: NASA & Cross-Dataset ───────────────────────────────────────────

function NASACapacityChart() {
  const b0006EolCap = NASA_CELLS_DATA.find(c => c.id === 'B0006').eolCap;

  return (
    <Card style={{ marginBottom: 20 }}>
      <ChartHeadline text="B0006 is the only cell to reach end-of-life during the experiment — it fades 41.7% in 168 cycles" />
      <ChartSub text="NASA 18650 cells · capacity (Ah) vs charge–discharge cycle · EOL = 70% of each cell's initial capacity" />

      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px' }}>
        <strong>About the upticks:</strong> Small capacity increases (visible at cycle 20 for B0005 and cycle 40 for B0006) are
        real electrochemical behaviour — lithium redistribution within the electrode temporarily recovers
        some capacity. They are not measurement errors.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
        {NASA_CELLS_DATA.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
            <div style={{ width: 20, height: 3, background: c.color, borderRadius: 2 }} />
            {c.label} ({c.fadePct}% fade, {c.totalCycles} cycles)
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={NASA_CHART_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="cycle"
            type="number"
            domain={[0, 168]}
            tickFormatter={v => `C${v}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            label={{ value: 'Cycle number', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            domain={[1.1, 2.1]}
            tickFormatter={v => `${v.toFixed(2)}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={50}
            label={{ value: 'Capacity (Ah)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
          />
          <Tooltip
            formatter={(v, name) => {
              const cell = NASA_CELLS_DATA.find(c => c.id === name);
              return [`${parseFloat(v).toFixed(3)} Ah`, cell?.label || name];
            }}
            labelFormatter={v => `Cycle ${v}`}
          />
          {/* EOL threshold for B0006 — the only cell that crosses it */}
          <ReferenceLine
            y={b0006EolCap}
            stroke="#ef4444"
            strokeDasharray="6 3"
            label={{ value: `B0006 EOL ${b0006EolCap} Ah`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
          />
          {/* Shared lower EOL band (~1.30 Ah) for B0005/B0007/B0018 */}
          <ReferenceLine
            y={1.299}
            stroke="#9ca3af"
            strokeDasharray="4 2"
            label={{ value: 'EOL ~1.30 Ah (B0005/B0007/B0018)', position: 'insideBottomRight', fontSize: 10, fill: '#9ca3af' }}
          />
          {NASA_CELLS_DATA.map(cell => (
            <Line
              key={cell.id}
              type="monotone"
              dataKey={cell.id}
              stroke={cell.color}
              strokeWidth={2}
              dot={{ r: 3, fill: cell.color }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              legendType="none"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function NASARmseChart() {
  const data = MODELS.map(m => ({
    model: m,
    rmse: NASA_RMSE.mean[m],
    color: MODEL_COLORS[m],
  })).sort((a, b) => a.rmse - b.rmse);

  return (
    <Card style={{ marginBottom: 20 }}>
      <ChartHeadline text="Exponential decay is the clear winner on NASA data — Polynomial falls to 4th place" />
      <ChartSub text="Mean RMSE (Ah) across all 4 NASA cells — lower is better" />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" domain={[0, 0.30]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 11, fill: '#9ca3af' }} label={{ value: 'RMSE (Ah)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }} />
          <YAxis type="category" dataKey="model" width={100} tick={{ fontSize: 11, fill: '#374151' }} />
          <Tooltip formatter={(v) => [`${v.toFixed(3)} Ah`, 'Mean RMSE']} />
          <Bar dataKey="rmse" radius={[0, 6, 6, 0]}>
            {data.map((entry, i) => (
              <RCell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={d.model} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: d.color, minWidth: 18 }}>#{i + 1}</span>
            <span style={{ fontWeight: 600, color: '#374151', minWidth: 110 }}>{d.model}</span>
            <span style={{ color: '#6b7280' }}>{MODEL_DESCRIPTIONS[d.model]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CrossDatasetChart() {
  const data = MODELS.map(m => ({
    model: m,
    Oxford: OXFORD_RMSE.mean[m],
    NASA: NASA_RMSE.mean[m],
  }));

  return (
    <Card style={{ marginBottom: 20 }}>
      <ChartHeadline text="The best model depends on how the battery was used — no single model wins on both datasets" />
      <ChartSub text="Mean RMSE (Ah) per model — Oxford (monthly checkpoints, trading protocol) vs NASA (per-cycle, lab conditions) — lower is better" />
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="model" tick={{ fontSize: 11, fill: '#374151' }} />
          <YAxis tickFormatter={v => `${v.toFixed(2)}`} tick={{ fontSize: 11, fill: '#9ca3af' }} width={45} label={{ value: 'RMSE (Ah)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip formatter={(v, name) => [`${v.toFixed(3)} Ah`, name]} />
          <Legend />
          <Bar dataKey="Oxford" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Oxford dataset" />
          <Bar dataKey="NASA"   fill="#f59e0b" radius={[4, 4, 0, 0]} name="NASA dataset" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function NASAPerCellTable() {
  const cells = ['B0005', 'B0006', 'B0007', 'B0018'];
  return (
    <Card style={{ marginBottom: 20 }}>
      <ChartHeadline text="NASA per-cell RMSE — B0006 favours Polynomial, the others favour Exponential" />
      <ChartSub text="RMSE (Ah) per model per cell — winner per row highlighted" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Cell</th>
              {MODELS.map(m => (
                <th key={m} style={{ textAlign: 'right', padding: '6px 8px', color: MODEL_COLORS[m], fontWeight: 600 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map(cellId => {
              const row = NASA_RMSE.perCell[cellId];
              const best = Math.min(...MODELS.map(m => row[m]));
              return (
                <tr key={cellId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: '#374151' }}>{cellId}</td>
                  {MODELS.map(m => (
                    <td key={m} style={{
                      padding: '6px 8px', textAlign: 'right', fontWeight: row[m] === best ? 700 : 400,
                      color: row[m] === best ? MODEL_COLORS[m] : '#374151',
                      background: row[m] === best ? `${MODEL_COLORS[m]}18` : 'transparent',
                    }}>
                      {row[m].toFixed(3)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
              <td style={{ padding: '6px 8px', fontWeight: 700, color: '#374151' }}>Mean</td>
              {MODELS.map(m => {
                const best = Math.min(...MODELS.map(mm => NASA_RMSE.mean[mm]));
                return (
                  <td key={m} style={{
                    padding: '6px 8px', textAlign: 'right', fontWeight: NASA_RMSE.mean[m] === best ? 700 : 600,
                    color: NASA_RMSE.mean[m] === best ? MODEL_COLORS[m] : '#374151',
                    background: NASA_RMSE.mean[m] === best ? `${MODEL_COLORS[m]}18` : 'transparent',
                  }}>
                    {NASA_RMSE.mean[m].toFixed(3)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function WhatThisMeansCard() {
  return (
    <div style={{
      background: '#f0fdf4',
      border: '1px solid #86efac',
      borderRadius: 12,
      padding: '18px 22px',
      marginBottom: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#14532d', marginBottom: 10 }}>
        What this means for real-world battery management
      </div>
      <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.7, margin: 0 }}>
        Polynomial regression wins on the Oxford energy-trading dataset (monthly checkpoints, variable
        cycling patterns) but ranks <strong>fourth</strong> on the NASA dataset (per-cycle lab data, more
        uniform conditions). Exponential decay wins on NASA but ranks <strong>third</strong> on Oxford.
        This means there is no single best degradation model — the right choice depends on the battery's
        usage pattern and measurement frequency. A model should be selected or validated against data
        from the specific application it will be deployed in.
      </p>
    </div>
  );
}

function NASAModule() {
  return (
    <div>
      <WhatThisMeansCard />
      <NASACapacityChart />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <NASARmseChart />
        <NASAPerCellTable />
      </div>
      <CrossDatasetChart />
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#0D2D5E', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>
            🔋 Battery Intelligence Platform
          </div>
          <div style={{ color: '#93c5fd', fontSize: 13, marginTop: 3 }}>
            University of West London · Supervised by Dr Fateme Dinmohammadi
          </div>
        </div>
        <div style={{ color: '#93c5fd', fontSize: 12, textAlign: 'right' }}>
          Oxford dataset: EOL = 80% of initial capacity<br />
          NASA dataset: EOL = 70% of initial capacity
        </div>
      </div>

      {/* Tab navigation */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
        {activeTab === 'overview'    && <OverviewModule />}
        {activeTab === 'soh'         && <SOHModule />}
        {activeTab === 'stress'      && <StressModule />}
        {activeTab === 'degradation' && <DegradationModule />}
        {activeTab === 'benchmark'   && <BenchmarkModule />}
        {activeTab === 'nasa'        && <NASAModule />}
      </div>

      {/* Footer citations */}
      <div style={{ padding: '10px 32px', borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.7 }}>
        Oxford Energy Trading Battery Degradation Dataset — Reniers, Mulder &amp; Howey, University of Oxford / EnergyVille, 2020.{' '}
        <span style={{ fontFamily: 'monospace' }}>DOI: 10.5287/bodleian:gJPdDzvP4</span>
        {activeTab === 'nasa' && (
          <>
            <br />
            NASA PCoE Battery Dataset — Saha &amp; Goebel, NASA Ames Research Center, 2007.
          </>
        )}
      </div>
    </div>
  );
}

export default App;
