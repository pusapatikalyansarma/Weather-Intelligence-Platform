
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import "./App.css";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Forecast from "./pages/Forecast";
import WeatherMap from "./pages/WeatherMap";

const API_URL = "http://127.0.0.1:5000/api/weather";

function AppLayout() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();

  const pageTitles = {
    "/dashboard": "Weather dashboard",
    "/forecast": "Weather forecast",
    "/weather-map": "Weather map",
  };

  async function fetchWeather(cityName) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}?city=${encodeURIComponent(cityName)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch weather.");
      }

      setWeather(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that Flask is running on port 5000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather("Tirupati");
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    const trimmedCity = city.trim();

    if (trimmedCity) {
      fetchWeather(trimmedCity);
      setCity("");
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">WEATHER INTELLIGENCE PLATFORM</p>
            <h1>{pageTitles[location.pathname] ?? "Weather dashboard"}</h1>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <span>⌕</span>

            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Search a city..."
              aria-label="Search city"
            />

            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Search"}
            </button>
          </form>
        </header>

        <div className="demo-notice">
          <span>ⓘ</span>
          {loading
            ? "Fetching the latest available weather data..."
            : "Live weather data powered by Open-Meteo."}
        </div>

        {error && (
          <div className="demo-notice" role="alert">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={
              <Dashboard weather={weather} loading={loading} />
            }
          />

          <Route
            path="/forecast"
            element={
              <Forecast weather={weather} loading={loading} />
            }
          />

          <Route
            path="/weather-map"
            element={<WeatherMap />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>

        <footer className="app-footer">
          WeatherIQ · React + Flask · Weather data by Open-Meteo
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
