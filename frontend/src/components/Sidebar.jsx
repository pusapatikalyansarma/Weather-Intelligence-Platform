import '../styles/Sidebar.css'
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">☀</span>
        <span>
          Weather<span className="brand-light">IQ</span>
        </span>
      </div>

      <p className="nav-heading">MENU</p>

      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `nav-item${isActive ? " active" : ""}`
        }
      >
        <span>◈</span> Overview
      </NavLink>

      <NavLink
        to="/forecast"
        className={({ isActive }) =>
          `nav-item${isActive ? " active" : ""}`
        }
      >
        <span>▦</span> Forecast
      </NavLink>

      <NavLink
        to="/weather-map"
        className={({ isActive }) =>
          `nav-item${isActive ? " active" : ""}`
        }
      >
        <span>◎</span> Weather map
      </NavLink>

      <div className="sidebar-bottom">
        <div className="sidebar-weather">☁️</div>
        <p>Weather, simplified.</p>
        <small>Understand your world.</small>
      </div>
    </aside>
  );
}
