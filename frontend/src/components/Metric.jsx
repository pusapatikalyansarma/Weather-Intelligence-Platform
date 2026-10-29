import '../styles/Metric.css'
export default function Metric({ icon, label, value, note }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">{label}</span>
      </div>

      <h3>{value}</h3>
      <p>{note}</p>
    </article>
  );
}
