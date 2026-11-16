const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export class WeatherError extends Error {}

export async function findCity(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new WeatherError('Could not reach the location service. Please try again.');
  const data = await res.json();
  if (!data.results?.length) throw new WeatherError(`No city found for "${name}".`);
  const { name: city, country, latitude, longitude } = data.results[0];
  return { city, country, latitude, longitude };
}

export async function getForecast({ latitude, longitude }, unit = 'celsius') {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    temperature_unit: unit,
    wind_speed_unit: 'kmh',
    timezone: 'auto',
    forecast_days: 5,
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new WeatherError('Weather service is unavailable. Please try again later.');
  return res.json();
}
