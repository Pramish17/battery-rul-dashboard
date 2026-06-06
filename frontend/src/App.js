import { useEffect, useState } from 'react';
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
import './App.css';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:5001/api/battery-data'
  : 'https://battery-rul-dashboard-production.up.railway.app/api/battery-data';

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'soh',         label: 'SoH Tracking' },
  { id: 'stress',      label: 'Stress Analysis' },
  { id: 'degradation', label: 'Degradation' },
  { id: 'benchmark',   label: 'Benchmark & EOL' },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 32px',
      display: 'flex',
      gap: 0,
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

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

function OverviewModule({ cells, summary }) {
  return (
    <div>
      <SectionTitle
        title="Fleet Overview"
        subtitle="Summary metrics and per-cell health status across all 6 Kokam 16 Ah cells"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <MetricCard
          label="Critical cells"
          value={summary.criticalCount}
          sub="Require immediate attention"
          color="#dc2626"
        />
        <MetricCard
          label="Healthy cells"
          value={summary.healthyCount}
          sub="Above 96% SOH"
          color="#16a34a"
        />
        <MetricCard
          label="Fastest degrading"
          value="BMR Cell 2"
          sub="14.85% fade · 8.4 months RUL"
          color="#dc2626"
        />
        <MetricCard
          label="BMR vs SPM ratio"
          value={`${summary.degradationRatio}×`}
          sub="BMR degrades this much faster"
          color="#d97706"
        />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
        Cell health status — all 6 cells
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {cells.map(c => <CellCard key={c.id} cell={c} />)}
      </div>
    </div>
  );
}

function SOHModule({ chartSeries, cells, eolCap }) {
  return (
    <div>
      <SectionTitle
        title="State of Health Tracking"
        subtitle="Capacity fade, SOH trajectory, and remaining useful life estimates across all cells"
      />
      <div style={{ marginBottom: 16 }}>
        <CapacityChart series={chartSeries} eolCap={eolCap} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SOHChart series={chartSeries} />
        <RULChart cells={cells} />
      </div>
    </div>
  );
}

function StressModule({ cells }) {
  return (
    <div>
      <SectionTitle
        title="Stress Analysis"
        subtitle="Operational limit violations per cell — overvoltage, undervoltage, overtemperature, overcurrent"
      />
      <StressAlertsPanel cells={cells} />
    </div>
  );
}

function DegradationModule({ cells }) {
  return (
    <div>
      <SectionTitle
        title="Degradation Drivers"
        subtitle="Attributed capacity fade by stress factor and control/optimisation model performance comparison"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DegradationDrivers cells={cells} />
        <StrategyComparison cells={cells} />
      </div>
    </div>
  );
}

function BenchmarkModule({ cells, benchmark }) {
  return (
    <div>
      <SectionTitle
        title="Benchmark & End-of-Life"
        subtitle="Performance vs Oxford dataset baseline and projected EOL dates by linear fade extrapolation"
      />
      <div style={{ marginBottom: 16 }}>
        <BenchmarkPanel cells={cells} benchmark={benchmark} />
      </div>
      <EOLDatePanel cells={cells} />
    </div>
  );
}

function App() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#6b7280' }}>
      Loading battery data...
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, color: '#dc2626' }}>
      Error: {error}. Make sure Flask is running on port 5001.
    </div>
  );

  const { cells, chartSeries, eolCap, summary, benchmark } = data;

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#0D2D5E', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>
            🔋 Battery Intelligence Platform
          </div>
          <div style={{ color: '#93c5fd', fontSize: 13, marginTop: 3 }}>
            University of West London · Supervised by Dr Fateme Dinmohammadi · Oxford Energy Trading Dataset · 6 Kokam 16 Ah Li-ion cells
          </div>
        </div>
        <div style={{ color: '#93c5fd', fontSize: 12, textAlign: 'right' }}>
          EOL threshold: 80% of initial capacity per cell<br />
          <span style={{ color: '#6ee7b7' }}>● Live</span>
        </div>
      </div>

      {/* Tab navigation */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Module content */}
      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 'overview'    && <OverviewModule   cells={cells} summary={summary} />}
        {activeTab === 'soh'         && <SOHModule        chartSeries={chartSeries} cells={cells} eolCap={eolCap} />}
        {activeTab === 'stress'      && <StressModule     cells={cells} />}
        {activeTab === 'degradation' && <DegradationModule cells={cells} />}
        {activeTab === 'benchmark'   && <BenchmarkModule  cells={cells} benchmark={benchmark} />}
      </div>

      {/* Dataset citation */}
      <div style={{ padding: '10px 32px', borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
        Oxford Energy Trading Battery Degradation Dataset — Reniers, Mulder &amp; Howey, University of Oxford / EnergyVille, 2020.{' '}
        <span style={{ fontFamily: 'monospace' }}>DOI: 10.5287/bodleian:gJPdDzvP4</span>
      </div>
    </div>
  );
}

export default App;
