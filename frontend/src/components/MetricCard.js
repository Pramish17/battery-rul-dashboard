function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: 12,
      padding: '16px 20px',
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: color || '#111827' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default MetricCard;