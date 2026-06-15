const SEVERITY_COLORS = {
  High:   { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', dot: '#dc2626' },
  Medium: { bg: '#fffbeb', text: '#d97706', border: '#fcd34d', dot: '#d97706' },
  Low:    { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd', dot: '#2563eb' },
};

function StressAlertsPanel({ cells }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.35 }}>
        BMR cells violate operating limits thousands of times — SPM cells operate safely within bounds
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
        Overvoltage (&gt;4.20 V) · Undervoltage (&lt;2.70 V) · Overtemperature (&gt;40 °C) · Overcurrent (&gt;2C) — estimated from cycling profiles
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {cells.map(cell => {
          const stress    = cell.stress || {};
          const alerts    = stress.alerts  || [];
          const summary   = stress.summary || {};
          const hasAlerts = alerts.length > 0;

          return (
            <div key={cell.id} style={{
              border:       `1px solid ${hasAlerts ? '#fca5a5' : '#e5e7eb'}`,
              borderRadius: 10,
              padding:      '12px 14px',
              background:   hasAlerts ? '#fef9f9' : '#f9fafb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{cell.label}</div>
                <span style={{
                  background:   hasAlerts ? '#fef2f2' : '#f0fdf4',
                  color:        hasAlerts ? '#dc2626' : '#16a34a',
                  border:       `1px solid ${hasAlerts ? '#fca5a5' : '#86efac'}`,
                  borderRadius: 20, fontSize: 11, fontWeight: 600, padding: '2px 8px',
                }}>
                  {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {alerts.map((alert, i) => {
                const sc = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.Low;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6,
                    padding: '5px 8px', marginBottom: 4,
                    background: sc.bg, borderRadius: 6, border: `1px solid ${sc.border}`,
                  }}>
                    <span style={{ color: sc.dot, marginTop: 1, fontSize: 9 }}>●</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: sc.text }}>{alert.type}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: sc.text,
                          background: '#fff', borderRadius: 4, padding: '1px 5px',
                          border: `1px solid ${sc.border}`,
                        }}>
                          {alert.count.toLocaleString()} readings
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{alert.message}</div>
                    </div>
                  </div>
                );
              })}

              {alerts.length === 0 && (
                <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginBottom: 4 }}>
                  No limit violations detected
                </div>
              )}

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
                marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb',
              }}>
                {[
                  ['Max V',  summary.maxVoltage != null ? `${summary.maxVoltage} V`  : '–'],
                  ['Min V',  summary.minVoltage != null ? `${summary.minVoltage} V`  : '–'],
                  ['Max I',  summary.maxCurrent != null ? `${summary.maxCurrent} A`  : '–'],
                  ['Avg T',  summary.avgTemp    != null ? `${summary.avgTemp} °C`    : '–'],
                  ['Max T',  summary.maxTemp    != null ? `${summary.maxTemp} °C`    : '–'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ fontSize: 10, color: '#6b7280' }}>
                    {lbl}: <span style={{ fontWeight: 600, color: '#374151' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StressAlertsPanel;
