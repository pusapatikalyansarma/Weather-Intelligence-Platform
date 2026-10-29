import '../styles/Dashboard.css'
import Metric from "../components/Metric";

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

export default function Dashboard({ weather, loading }) {
  if (!weather?.current) {
    return (
      <p>
        {loading
          ? "Loading weather dashboard..."
          : "Weather data is not available. Search for a city to try again."}
      </p>
    );
  }

  const current = weather.current;
  const airQuality = weather.airQuality;
  const today = weather.forecast?.[0];

  return (
    <>
      <section className="hero-card">
        <div className="hero-details">
          <p className="eyebrow">CURRENT WEATHER</p>
          <h2>{weather.location.name}</h2>

          <p className="hero-description">
            {weather.location.admin1
              ? `${weather.location.admin1}, ${weather.location.country}`
              : weather.location.country}
          </p>

          <div className="temperature">
            {Math.round(current.temperature)}
            <span>°C</span>
          </div>

          <p className="condition">
            {getWeatherIcon(current.weatherCode, current.isDay)}{" "}
            {current.condition}
          </p>

          <p className="feels-like">
            Feels like {Math.round(current.feelsLike)}°C
          </p>
        </div>

        <div className="hero-sun" aria-label={current.condition}>
          {getWeatherIcon(current.weatherCode, current.isDay)}
        </div>

        <div className="hero-footer">
          <span>
            ☀ Sunrise: {today?.sunrise?.slice(11, 16) ?? "--:--"}
          </span>
          <span>
            🌇 Sunset: {today?.sunset?.slice(11, 16) ?? "--:--"}
          </span>
          <span>
            Updated: {current.time?.replace("T", " ") ?? "Unavailable"}
          </span>
        </div>
      </section>

      <section className="metrics-grid">
        <Metric
          icon="💧"
          label="Humidity"
          value={`${current.humidity}%`}
          note="Relative humidity"
        />

        <Metric
          icon="💨"
          label="Wind speed"
          value={`${current.windSpeed} km/h`}
          note="Near surface"
        />

        <Metric
          icon="🌡️"
          label="Feels like"
          value={`${Math.round(current.feelsLike)}°C`}
          note="Apparent temperature"
        />

        <Metric
          icon="🌧️"
          label="Rain chance"
          value={today?.rainChance == null ? "—" : `${today.rainChance}%`}
          note="Today's precipitation probability"
        />

        <Metric
          icon="🧭"
          label="Pressure"
          value={`${current.pressure} hPa`}
          note="Mean sea-level pressure"
        />

        <Metric
          icon="👁️"
          label="Visibility"
          value={`${(current.visibility / 1000).toFixed(1)} km`}
          note="Horizontal visibility"
        />

        <Metric
          icon="☀️"
          label="UV index"
          value={current.uvIndex ?? "—"}
          note="Current UV level"
        />
        
        <Metric
          icon="🌫️"
          label="European AQI"
          value={airQuality?.aqi ?? "Unavailable"}
          note={
            airQuality?.aqi == null
              ? "European Air Quality Index"
              : airQuality.aqi > 100
                ? "Extremely poor"
                : airQuality.aqi > 80
                  ? "Very poor"
                  : airQuality.aqi > 60
                    ? "Poor"
                    : airQuality.aqi > 40
                      ? "Moderate"
                      : airQuality.aqi > 20
                        ? "Fair"
                        : "Good"
          }
        />


        <Metric
          icon="🫧"
          label="PM2.5"
          value={
              airQuality?.pm25 == null
              ? "—"
              : `${airQuality.pm25} µg/m³`
          }
          note="Fine particulate matter"
        />

        <Metric
          icon="🌁"
          label="PM10"
          value={
              airQuality?.pm10 == null
              ? "—"
              : `${airQuality.pm10} µg/m³`
          }
          note="Particulate matter"
        />
      </section>
    </>
  );
}
