import '../styles/Forecast.css'
import HourlyForecast from "../components/HourlyForecast";

function getWeatherIcon(code, isDay = 1) {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code === 1) return isDay ? "🌤️" : "☁️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

function formatDate(dateString, index) {
  const date = new Date(`${dateString}T12:00:00`);

  const dayName =
    index === 0
      ? "Today"
      : index === 1
      ? "Tomorrow"
      : date.toLocaleDateString("en-IN", {
          weekday: "long",
        });

  const exactDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${dayName} · ${exactDate}`;
}

export default function Forecast({ weather, loading }) {
  if (!weather) {
    return (
      <p>
        {loading
          ? "Loading forecast..."
          : "Forecast is not available. Try searching for a city again."}
      </p>
    );
  }

  const forecast = weather.forecast ?? [];
  const hourlyForecast = weather.hourlyForecast ?? [];

  return (
    <>
      <section className="section">
        <div className="section-heading">
           <div>
                <p className="eyebrow">PLAN AHEAD</p>
                <h2>{weather.location.name} — 5-day forecast</h2>
            </div>
          <span className="section-note">{weather.source}</span>
        </div>

        <div className="forecast-grid">
          {forecast.map((item, index) => (
            <article className="forecast-card" key={item.date}>
              <p className="forecast-day">
                {formatDate(item.date, index)}
              </p>

              <div className="forecast-icon">
                {getWeatherIcon(item.weatherCode)}
              </div>

              <p className="forecast-condition">
                {item.condition}
              </p>

              <div className="forecast-temperatures">
                <strong>{Math.round(item.high)}°</strong>
                <span>{Math.round(item.low)}°</span>
              </div>

              <p className="forecast-condition">
                Rain:{" "}
                {item.rainChance == null
                  ? "—"
                  : `${item.rainChance}%`}
              </p>
            </article>
          ))}
        </div>
      </section>

      <HourlyForecast data={hourlyForecast} />
    </>
  );
}
