import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label, chartData }) {
  if (!active || !payload || !payload.length) return null;
  const d = chartData.find(x => x.name === label);
  if (!d) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.cell}</div>
      <div style={{ color: '#ef4444' }}>Temperature: {d.temp.toFixed(2)}% · avg {d.avgTemp}°C · stress score {d.tempScore}</div>
      <div style={{ color: '#f59e0b' }}>C-Rate: {d.crate.toFixed(2)}% · avg {d.avgCRate}C · stress score {d.cRateScore}</div>
      <div style={{ color: '#3b82f6' }}>Depth of Discharge: {d.dod.toFixed(2)}% · avg DoD {d.avgDoD}% · stress score {d.doDScore}</div>
    </div>
  );
}

function DegradationDrivers({ cells }) {
  const chartData = cells.map(c => {
    const drv = c.drivers || {};
    return {
      name:       c.label.replace(' Cell ', ' C'),
      cell:       c.label,
      temp:       drv.tempContribution  ?? 0,
      crate:      drv.cRateContribution ?? 0,
      dod:        drv.doDContribution   ?? 0,
      tempScore:  drv.tempScore  ?? 0,
      cRateScore: drv.cRateScore ?? 0,
      doDScore:   drv.doDScore   ?? 0,
      avgTemp:    drv.avgTemp    ?? 0,
      avgCRate:   drv.avgCRate   ?? 0,
      avgDoD:     drv.avgDoD     ?? 0,
    };
  });

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
        BMR cells experience far greater stress from current, temperature and deep discharge
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
        Estimated contributions (modelled, not directly measured) of Temperature · C-Rate · Depth of Discharge to total capacity loss
      </div>
      <div style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '5px 9px', marginBottom: 14 }}>
        These are modelled estimates based on observed capacity loss and cycle parameters - not direct measurements.
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} />
          <YAxis
            tickFormatter={v => `${v.toFixed(1)}%`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={45}
          />
          <Tooltip content={<CustomTooltip chartData={chartData} />} />
          <Legend />
          <Bar dataKey="temp"  name="Temperature"        stackId="a" fill="#ef4444" />
          <Bar dataKey="crate" name="C-Rate"             stackId="a" fill="#f59e0b" />
          <Bar dataKey="dod"   name="Depth of Discharge" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DegradationDrivers;
