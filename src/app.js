import { findCity, getForecast, WeatherError } from './api.js';
import { describeWeather } from './weatherCodes.js';

const $ = (id) => document.querySelector(`[data-testid="${id}"]`);
const form = document.getElementById('search-form');
const input = document.getElementById('city');
const status = $('status');
const RECENT_KEY = 'weather.recent';

let unit = 'celsius';
let lastPlace = null;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []; } catch { return []; }
}

function saveRecent(city) {
  const list = [city, ...loadRecent().filter((c) => c.toLowerCase() !== city.toLowerCase())].slice(0, 5);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  renderRecent();
}

function renderRecent() {
  const list = loadRecent();
  document.getElementById('recent').hidden = list.length === 0;
  $('recent').replaceChildren(...list.map((city) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = city;
    btn.addEventListener('click', () => search(city));
    li.append(btn);
    return li;
  }));
}

function render(place, data) {
  const symbol = unit === 'celsius' ? '°C' : '°F';
  const { current, daily } = data;
  const { label, icon } = describeWeather(current.weather_code);

  $('location').textContent = `${place.city}, ${place.country}`;
  $('icon').textContent = icon;
  $('temperature').textContent = `${Math.round(current.temperature_2m)}${symbol}`;
  $('condition').textContent = label;
  $('humidity').textContent = `${current.relative_humidity_2m}%`;
  $('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  $('forecast').replaceChildren(...daily.time.map((date, i) => {
    const li = document.createElement('li');
    const day = new Date(`${date}T00:00`).toLocaleDateString('en-US', { weekday: 'short' });
    const d = describeWeather(daily.weather_code[i]);
    li.innerHTML = `<span>${day} ${d.icon}</span><span>${Math.round(daily.temperature_2m_max[i])}°</span><span>${Math.round(daily.temperature_2m_min[i])}°</span>`;
    return li;
  }));

  document.getElementById('current').hidden = false;
  document.getElementById('forecast').hidden = false;
}

async function search(name) {
  const query = name.trim();
  if (!query) return setStatus('Please enter a city name.', true);
  setStatus('Loading…');
  try {
    const place = await findCity(query);
    const data = await getForecast(place, unit);
    lastPlace = place;
    render(place, data);
    saveRecent(place.city);
    setStatus('');
  } catch (err) {
    document.getElementById('current').hidden = true;
    document.getElementById('forecast').hidden = true;
    setStatus(err instanceof WeatherError ? err.message : 'Something went wrong. Check your connection.', true);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  search(input.value);
});

document.querySelectorAll('[data-unit]').forEach((btn) => {
  btn.addEventListener('click', () => {
    unit = btn.dataset.unit;
    document.querySelectorAll('[data-unit]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    if (lastPlace) search(lastPlace.city);
  });
});

renderRecent();
