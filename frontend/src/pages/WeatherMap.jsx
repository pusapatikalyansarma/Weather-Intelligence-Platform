
import "../styles/WeatherMap.css";
import "../styles/Dashboard.css";
import "../styles/Forecast.css";

import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet.heat";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import Metric from "../components/Metric";
import HourlyForecast from "../components/HourlyForecast";

import "leaflet/dist/leaflet.css";

const API_URL = "http://127.0.0.1:5000/api/weather";

const tileUrls = {
  standard:
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

  dark:
    "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
};

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

function MapUpdater({ position, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, zoom);
  }, [map, position, zoom]);

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}
function TemperatureHeatLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatPoints = points.map((point) => [
      point.latitude,
      point.longitude,
      point.intensity,
    ]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 45,
      blur: 35,
      maxZoom: 10,
      max: 1,
      minOpacity: 0.25,
      gradient: {
        0.2: "#2563eb",
        0.4: "#22c55e",
        0.6: "#facc15",
        0.8: "#f97316",
        1.0: "#dc2626",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default function WeatherMap() {
  const [place, setPlace] = useState("Hyderabad");
  const [searchText, setSearchText] = useState("");

  const [position, setPosition] = useState([17.385, 78.4867]);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const [mapType, setMapType] = useState("standard");
  const [overlayMode, setOverlayMode] = useState("weather");
  const [radarTileUrl, setRadarTileUrl] = useState("");
  const [radarError, setRadarError] = useState("");

  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [error, setError] = useState("");
  const [weatherError, setWeatherError] = useState("");

  const [weather, setWeather] = useState(null);
  const [temperaturePoints, setTemperaturePoints] = useState([]);
  const [temperatureLoading, setTemperatureLoading] = useState(false);
  const [temperatureError, setTemperatureError] = useState("");
  useEffect(() => {
  async function loadRadar() {
    try {
      const response = await fetch(
        "https://api.rainviewer.com/public/weather-maps.json"
      );

      if (!response.ok) {
        throw new Error("Radar data is unavailable.");
      }

      const data = await response.json();
      const frames = data.radar?.past || [];
      const latestFrame = frames[frames.length - 1];

      if (!latestFrame) {
        throw new Error("No radar frames are available.");
      }

      setRadarTileUrl(
        `${data.host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_0.png`
      );
      setRadarError("");
    } catch (err) {
      setRadarError(err.message);
    }
  }

  loadRadar();
  }, []);

  async function searchPlace(event) {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      setError("Please enter a place name.");
      return;
    }

    setLoading(true);
    setWeatherLoading(false);
    setError("");
    setWeatherError("");
    setWeather(null);

    try {
      // Step 1: Find the searched city's coordinates.
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Place search is temporarily unavailable.");
      }

      const results = await response.json();

      if (results.length === 0) {
        throw new Error("Place not found. Try another name.");
      }

      const result = results[0];

      const lat = Number(result.lat);
      const lon = Number(result.lon);

      // Step 2: Move the map to the searched location.
      setPosition([lat, lon]);
      setPlace(result.display_name);
      setSelectedPoint(null);
      setSearchText(query);

      setLoading(false);

      // Step 3: Fetch weather only for this Weather Map page.
      setWeatherLoading(true);

      const weatherResponse = await fetch(
        `${API_URL}?city=${encodeURIComponent(query)}`
      );

      const weatherData = await weatherResponse.json();

      if (!weatherResponse.ok) {
        throw new Error(
          weatherData.error || "Unable to fetch weather data."
        );
      }

      setWeather(weatherData);
    } catch (err) {
      if (loading) {
        setError(err.message || "Unable to search this place.");
      } else {
        setWeatherError(
          err.message || "Unable to fetch weather data for this city."
        );
      }
    } finally {
      setLoading(false);
      setWeatherLoading(false);
    }
  }
  // Fetch real temperature readings around the selected map location
useEffect(() => {
  let cancelled = false;

  async function loadTemperaturePoints() {
    setTemperatureLoading(true);
    setTemperatureError("");

    try {
      const points = [];
      const gridSize = 9;
      const spacing = 0.2;

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          points.push({
            latitude:
              position[0] + (row - (gridSize - 1) / 2) * spacing,
            longitude:
              position[1] + (col - (gridSize - 1) / 2) * spacing,
          });
        }
      }

      const latitudes = points
        .map((point) => point.latitude)
        .join(",");

      const longitudes = points
        .map((point) => point.longitude)
        .join(",");

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitudes}` +
        `&longitude=${longitudes}` +
        `&current=temperature_2m`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Unable to fetch temperature readings.");
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];

      const temperatureData = results
        .map((item, index) => {
          const temperature = item.current?.temperature_2m;

          if (temperature == null || !points[index]) return null;

          // Convert temperature into a heat intensity.
          const intensity = Math.max(
            0.2,
            Math.min(1, (temperature + 10) / 50)
          );

          return {
            ...points[index],
            temperature,
            intensity,
          };
        })
        .filter(Boolean);

      if (!cancelled) {
        setTemperaturePoints(temperatureData);

        if (!temperatureData.length) {
          setTemperatureError("No temperature readings were returned.");
        }
      }
    } catch (err) {
      if (!cancelled) {
        setTemperatureError(err.message);
        setTemperaturePoints([]);
      }
    } finally {
      if (!cancelled) {
        setTemperatureLoading(false);
      }
    }
  }

  loadTemperaturePoints();

  return () => {
    cancelled = true;
  };
}, [position]);
  const current = weather?.current;
  const today = weather?.forecast?.[0];
  const airQuality = weather?.airQuality;

  return (
    <section className="section weather-map-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EXPLORE CONDITIONS</p>
          <h2>Weather Map</h2>
          <p className="map-description">
            Search for a city to explore its location and weather conditions.
          </p>
        </div>
      </div>

      <form className="map-search-form" onSubmit={searchPlace}>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search city, village, country or landmark..."
          aria-label="Search for a place"
        />

        <button type="submit" disabled={loading || weatherLoading}>
          {loading
            ? "Searching..."
            : weatherLoading
              ? "Loading weather..."
              : "Search place"}
        </button>
      </form>

      {error && (
        <p role="alert" className="map-error">
          {error}
        </p>
      )}

      <div className="map-toolbar">
        <span>
          Selected place: <strong>{place}</strong>
        </span>

        <button
          type="button"
          onClick={() =>
            setMapType((current) =>
              current === "standard" ? "dark" : "standard"
            )
          }
        >
          Switch map theme
        </button>
        <button
            type="button"
            className="map-layer-button"
            onClick={() =>
              setOverlayMode((current) =>
                current === "weather" ? "temperature" : "weather"
              )
            }
          >
            {overlayMode === "weather"
              ? "Switch to Temperature Map"
              : "Switch to Weather Overlay"}
          </button>
      </div>

            <div className="weather-map-container">
        <MapContainer
          center={position}
          zoom={10}
          scrollWheelZoom={true}
          className="weather-map"
        >
          <TileLayer
            key={mapType}
            attribution={
              mapType === "standard"
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                : '&copy; OpenStreetMap &copy; CARTO'
            }
            url={tileUrls[mapType]}
          />

          {overlayMode === "weather" && radarTileUrl && (
            <TileLayer
              key="weather-radar"
              url={radarTileUrl}
              opacity={0.65}
              attribution='Weather radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
            />
          )}

          {overlayMode === "temperature" && (
            <TemperatureHeatLayer points={temperaturePoints} />
          )}

          <MapUpdater position={position} zoom={10} />

          <MapClickHandler onSelect={setSelectedPoint} />

          <Marker position={position}>
            <Popup>
              <strong>{place}</strong>
              <br />
              Latitude: {position[0].toFixed(5)}
              <br />
              Longitude: {position[1].toFixed(5)}
            </Popup>
          </Marker>

          {selectedPoint && (
            <Marker position={selectedPoint}>
              <Popup>
                <strong>Selected map point</strong>
                <br />
                Latitude: {selectedPoint[0].toFixed(5)}
                <br />
                Longitude: {selectedPoint[1].toFixed(5)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {radarError && (
        <p className="map-error">
          Rain radar: {radarError}
        </p>
      )}

      {overlayMode === "temperature" && (
        <p className="map-help">
          {temperatureLoading
            ? "Loading temperature readings..."
            : temperatureError
              ? `Temperature map: ${temperatureError}`
              : `Temperature heatmap based on ${temperaturePoints.length} available readings. Colours between readings are interpolated estimates.`}
        </p>
      )}

      <p className="map-help">
        Search for a place to move the map. Click anywhere on the map
        to view that point&apos;s coordinates.
      </p>

      {/* Weather details for the searched city */}
      {weatherLoading && (
        <p>Loading weather details for {place}...</p>
      )}

      {weatherError && (
        <p role="alert" className="map-error">
          {weatherError}
        </p>
      )}

      {weather && current && (
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

          <section className="section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PLAN AHEAD</p>
                <h2>{weather.location.name} — 5-day forecast</h2>
              </div>

              <span className="section-note">{weather.source}</span>
            </div>

            <div className="forecast-grid">
              {(weather.forecast ?? []).map((item, index) => (
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

          <HourlyForecast data={weather.hourlyForecast ?? []} />
        </>
      )}
    </section>
  );
}
