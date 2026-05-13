import { useEffect, useState } from 'react';
import MetricCard from './components/MetricCard';
import CellCard from './components/CellCard';
import CapacityChart from './components/CapacityChart';
import SOHChart from './components/SOHChart';
import RULChart from './components/RULChart';
import './App.css';

function App() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch('https://battery-rul-dashboard-production.up.railway.app/api/battery-data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:16, color:'#6b7280' }}>
      Loading battery data...
    </div>
  );

  if (error) return (
    <div style={{ padding:40, color:'#dc2626' }}>
      Error: {error}. Make sure Flask is running on port 5001.
    </div>
  );

  const { cells, chartSeries, eolCap, summary } = data;

  return (
    <div style={{ background:'#f9fafb', minHeight:'100vh', fontFamily:'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#0D2D5E', padding:'20px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:20 }}>
            🔋 Battery RUL Dashboard
          </div>
          <div style={{ color:'#93c5fd', fontSize:13, marginTop:3 }}>
            Oxford Energy Trading Dataset · 6 Kokam 16 Ah Li-ion cells · 1-year experiment
          </div>
        </div>
        <div style={{ color:'#93c5fd', fontSize:12, textAlign:'right' }}>
          EOL threshold: 80% capacity (12.8 Ah)<br />
          <span style={{ color:'#6ee7b7' }}>● Live</span>
        </div>
      </div>

      <div style={{ padding:'24px 32px', maxWidth:1200, margin:'0 auto' }}>

        {/* Metric Cards — full width 4 columns */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(4, 1fr)',
          gap:12, marginBottom:24,
        }}>
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

        {/* Cell Cards — fixed 3×2 grid */}
        <div style={{ fontSize:13, fontWeight:500, color:'#6b7280', marginBottom:10 }}>
          Cell health status — all 6 cells
        </div>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(3, 1fr)',
          gap:12, marginBottom:24,
        }}>
          {cells.map(c => <CellCard key={c.id} cell={c} />)}
        </div>

        {/* Charts */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <CapacityChart series={chartSeries} eolCap={eolCap} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <SOHChart series={chartSeries} />
            <RULChart cells={cells} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;