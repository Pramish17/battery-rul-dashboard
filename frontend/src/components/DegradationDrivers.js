import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label, chartData }) {
  if (!active || !payload || !payload.length) return null;
  const d = chartData.find(x => x.name === label);
  if (!d) return null;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.cell}</div>
      <div style={{ color: '#ef4444' }}>
        Temperature: {d.temp.toFixed(2)}% fade &nbsp;·&nbsp; avg {d.avgTemp}°C &nbsp;·&nbsp; stress score {d.tempScore}
      </div>
      <div style={{ color: '#f59e0b' }}>
        C-Rate: {d.crate.toFixed(2)}% fade &nbsp;·&nbsp; avg {d.avgCRate}C &nbsp;·&nbsp; stress score {d.cRateScore}
      </div>
      <div style={{ color: '#3b82f6' }}>
        Depth of Discharge: {d.dod.toFixed(2)}% fade &nbsp;·&nbsp; avg DoD {d.avgDoD}% &nbsp;·&nbsp; stress score {d.doDScore}
      </div>
    </div>
  );
}

function DegradationDrivers({ cells }) {
  const chartData = cells.map(c => {
    const drv = c.drivers || {};
    return {
      name:       c.label.replace(' Cell ', ' C'),
      cell:       c.label,
      error:      drv.error || null,
      temp:       drv.tempContribution  ?? 0,
      crate:      drv.cRateContribution ?? 0,
      dod:        drv.doDContribution   ?? 0,
      tempScore:  drv.tempScore         ?? 0,
      cRateScore: drv.cRateScore        ?? 0,
      doDScore:   drv.doDScore          ?? 0,
      avgTemp:    drv.avgTemp           ?? 0,
      avgCRate:   drv.avgCRate          ?? 0,
      avgDoD:     drv.avgDoD            ?? 0,
    };
  });

  const allErrored = chartData.every(d => d.error);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>
        Degradation Drivers — attributed capacity fade
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Proportional contribution of Temperature · C-Rate · Depth of Discharge to total capacity loss
      </div>

      {allErrored ? (
        <div style={{
          padding: '20px', textAlign: 'center',
          color: '#d97706', fontSize: 12, fontStyle: 'italic',
          background: '#fffbeb', borderRadius: 8, border: '1px solid #fcd34d',
        }}>
          Profile data unavailable — driver analysis requires per-cycle current, voltage and temperature readings
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default DegradationDrivers;
