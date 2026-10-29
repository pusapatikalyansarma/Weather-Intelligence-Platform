
import "../styles/WeatherMap.css";
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const tileUrls = {
  standard:
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark:
    "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=cb1_4xhs_1_3223884fb629607a0ee82861",
};

function MapUpdater({ position, zoom }) {
  const map = useMap();

  map.setView(position, zoom);

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

export default function WeatherMap() {
  const [place, setPlace] = useState("Hyderabad");
  const [searchText, setSearchText] = useState("");
  const [position, setPosition] = useState([17.385, 78.4867]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapType, setMapType] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchPlace(event) {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      setError("Please enter a place name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Place search is temporarily unavailable.");
      }

      const results = await response.json();

      if (results.length === 0) {
        setError("Place not found. Try another name.");
        return;
      }

      const result = results[0];
      const lat = Number(result.lat);
      const lon = Number(result.lon);

      setPosition([lat, lon]);
      setPlace(result.display_name);
      setSelectedPoint(null);
      setSearchText(query);
    } catch (err) {
      setError(err.message || "Unable to search this place.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section weather-map-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EXPLORE CONDITIONS</p>
          <h2>Weather Map</h2>
          <p className="map-description">
            Search for places around the world and explore their locations.
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

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search place"}
        </button>
      </form>

      {error && <p role="alert" className="map-error">{error}</p>}

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

          <MapUpdater
            position={position}
            zoom={10}
          />

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

      <p className="map-help">
        Search for a place to move the map. Click anywhere on the map
        to view that point&apos;s coordinates.
      </p>
    </section>
  );
}
