import '../styles/HourlyForecast.css'
function formatHour(time) {
  const [hours, minutes] = time.slice(11, 16).split(":");
  const hour = Number(hours);
  const period = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;

  return `${displayHour}${minutes === "00" ? "" : `:${minutes}`} ${period}`;
}

export default function HourlyForecast({ data = [] }) {
  if (!data.length) {
    return <p>Hourly forecast is not available.</p>;
  }

  const width = 700;
  const height = 220;
  const padding = { top: 25, right: 25, bottom: 35, left: 35 };

  const temperatures = data.map((item) => item.temperature);
  const minTemp = Math.floor(Math.min(...temperatures) - 2);
  const maxTemp = Math.ceil(Math.max(...temperatures) + 2);
  const tempRange = Math.max(maxTemp - minTemp, 1);

  const x = (index) =>
    padding.left +
    (index / Math.max(data.length - 1, 1)) *
      (width - padding.left - padding.right);

  const y = (temperature) =>
    padding.top +
    ((maxTemp - temperature) / tempRange) *
      (height - padding.top - padding.bottom);

  const points = data
    .map((item, index) => `${x(index)},${y(item.temperature)}`)
    .join(" ");

  const labelIndexes = [
    ...new Set([
      0,
      Math.floor((data.length - 1) / 3),
      Math.floor(((data.length - 1) * 2) / 3),
      data.length - 1,
    ]),
  ];

  return (
    <section className="hourly-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TEMPERATURE TRENDS</p>
          <h2>Hourly temperature</h2>
          <p>Temperature changes over the next 24 hours</p>
        </div>
      </div>

      <div className="hourly-chart-card">
        <div className="hourly-chart-summary">
          <span>Next 24 hours</span>
          <strong>
            {Math.round(temperatures[0])}°C
            <small> starting temperature</small>
          </strong>
        </div>

        <div className="hourly-chart-scroll">
          <svg
            className="hourly-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Hourly temperature forecast chart"
          >
            {[0, 1, 2, 3].map((step) => {
              const temp = maxTemp - (tempRange * step) / 3;
              const lineY = y(temp);

              return (
                <g key={step}>
                  <line
                    x1={padding.left}
                    y1={lineY}
                    x2={width - padding.right}
                    y2={lineY}
                    className="chart-grid-line"
                  />
                  <text
                    x={padding.left - 8}
                    y={lineY + 4}
                    textAnchor="end"
                    className="chart-axis-label"
                  >
                    {Math.round(temp)}°
                  </text>
                </g>
              );
            })}

            <polyline
              points={points}
              className="temperature-line"
            />

            {data.map((item, index) => (
              <circle
                key={item.time}
                cx={x(index)}
                cy={y(item.temperature)}
                r={index % 3 === 0 ? 4 : 2}
                className="temperature-point"
              >
                <title>
                  {formatHour(item.time)}: {item.temperature}°C
                </title>
              </circle>
            ))}

            {labelIndexes.map((index) => (
              <text
                key={index}
                x={x(index)}
                y={height - 8}
                textAnchor="middle"
                className="chart-axis-label"
              >
                {formatHour(data[index].time)}
              </text>
            ))}
          </svg>
        </div>

        <div className="hourly-temperature-list">
          {data.filter((_, index) => index % 3 === 0).map((item) => (
            <div
              className="hourly-temperature-item"
              key={item.time}
            >
              <span>{formatHour(item.time)}</span>
              <strong>{Math.round(item.temperature)}°C</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
