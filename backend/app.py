
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


def get_weather_description(code):
    """Convert Open-Meteo weather codes into readable descriptions."""
    descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Freezing drizzle",
        57: "Heavy freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail",
    }

    return descriptions.get(code, "Weather unavailable")


@app.route("/")
def home():
    return jsonify({
        "message": "Weather Intelligence API is running!",
        "status": "success"
    })


@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "weather-backend"
    })


@app.route("/api/weather")
def get_weather():
    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({
            "error": "Please provide a city name."
        }), 400

    try:
        # 1. Convert city name into geographic coordinates.
        geo_response = requests.get(
            GEOCODING_URL,
            params={
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            },
            timeout=10
        )
        geo_response.raise_for_status()
        geo_data = geo_response.json()

        locations = geo_data.get("results", [])

        if not locations:
            return jsonify({
                "error": f"No location found for '{city}'. Try another city."
            }), 404

        location = locations[0]
        latitude = location["latitude"]
        longitude = location["longitude"]

        # 2. Fetch current conditions and five-day forecast.
        weather_response = requests.get(
            WEATHER_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "apparent_temperature,"
                    "wind_speed_10m,"
                    "precipitation,"
                    "weather_code,"
                    "is_day,"
                    "pressure_msl,"
                    "visibility,"
                    "uv_index"
                ),
                "daily": (
                    "weather_code,"
                    "temperature_2m_max,"
                    "temperature_2m_min,"
                    "precipitation_probability_max,"
                    "sunrise,"
                    "sunset"
                ),
                "hourly": "temperature_2m",
                "forecast_hours": 24,
                "forecast_days": 5,
                "timezone": "auto"
            },
            timeout=15
        )
        weather_response.raise_for_status()
        weather_data = weather_response.json()
        # weather_data = weather_response.json()
                # 3. Fetch current air quality.
        air_quality = None

        try:
            air_response = requests.get(
                AIR_QUALITY_URL,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": "european_aqi,pm2_5,pm10",
                    "timezone": "auto"
                },
                timeout=10
            )
            air_response.raise_for_status()
            air_data = air_response.json()
            air_current = air_data.get("current", {})

            air_quality = {
                "aqi": air_current.get("european_aqi"),
                "pm25": air_current.get("pm2_5"),
                "pm10": air_current.get("pm10"),
                "time": air_current.get("time"),
                "source": "Open-Meteo Air Quality API"
            }

        except (requests.RequestException, ValueError):
            # Keep the weather dashboard working if air quality is unavailable.
            air_quality = None

        current = weather_data["current"]
        daily = weather_data["daily"]
        hourly = weather_data["hourly"]
        pressure = current["pressure_msl"]
        visibility = current["visibility"]
        uv_index = current["uv_index"]

        hourly_forecast = []

        for i, time in enumerate(hourly["time"]):
            hourly_forecast.append({
                "time": time,
                "temperature": hourly["temperature_2m"][i]
            })

        # 3. Format the daily forecast for the frontend.
        forecast = []

        for i, date in enumerate(daily["time"]):
            code = daily["weather_code"][i]

            forecast.append({
                "date": date,
                "condition": get_weather_description(code),
                "weatherCode": code,
                "high": daily["temperature_2m_max"][i],
                "low": daily["temperature_2m_min"][i],
                "rainChance": (
                    daily["precipitation_probability_max"][i]
                ),
                "sunrise": daily["sunrise"][i],
                "sunset": daily["sunset"][i]
            })

        # 4. Send clean JSON data to React.
        return jsonify({
            "status": "success",
            "location": {
                "name": location["name"],
                "admin1": location.get("admin1"),
                "country": location.get("country"),
                "latitude": latitude,
                "longitude": longitude,
                "timezone": weather_data.get("timezone")
            },
            "current": {
                "temperature": current["temperature_2m"],
                "humidity": current["relative_humidity_2m"],
                "feelsLike": current["apparent_temperature"],
                "windSpeed": current["wind_speed_10m"],
                "precipitation": current["precipitation"],
                "weatherCode": current["weather_code"],
                "condition": get_weather_description(
                    current["weather_code"]
                ),
                "isDay": current["is_day"],
                "time": current["time"],
                "pressure": pressure,
                "visibility": visibility,
                "uvIndex": uv_index,
            },
            "airQuality": air_quality,
            "hourlyForecast": hourly_forecast,
            "forecast": forecast,
            "units": weather_data.get("current_units", {}),
            "source": "Open-Meteo"
        })

    except requests.RequestException:
        return jsonify({
            "error": (
                "Unable to reach the weather service. "
                "Please try again."
            )
        }), 502

    except (KeyError, IndexError, TypeError, ValueError):
        return jsonify({
            "error": "Unexpected weather data received from the API."
        }), 502


if __name__ == "__main__":
    app.run(debug=True, port=5000)
