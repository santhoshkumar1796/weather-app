# Weather App

A lightweight weather app built with **vanilla JavaScript (ES modules)** on the free, no-API-key [Open-Meteo](https://open-meteo.com) API, tested end-to-end with **Playwright + TypeScript**.

## Features

- Search any city → current temperature, condition, humidity and wind
- 5-day forecast with highs/lows and weather icons
- °C / °F toggle
- Recent searches saved in `localStorage`
- Friendly errors for unknown cities, API failures and offline mode

## Run the app

```bash
npm install
npm start          # opens http://localhost:5173
```

## Testing approach

Tests never hit the real API. `tests/mocks.ts` uses `page.route()` to return fixture data, so the suite is **fast, deterministic and works offline**.

| Area | What is verified |
|------|------------------|
| Happy path | Location, temperature, condition, humidity, wind, 5 forecast rows |
| Requests | Searched city is sent to the geocoding API |
| Units | °C → °F conversion and toggle state |
| Persistence | Recent searches survive a page reload |
| Errors | Unknown city, HTTP 500, network abort |

```bash
npx playwright install chromium
npm test
npm run report
```

## Project structure

```
weather-app/
├── index.html
├── src/
│   ├── app.js           # UI + state
│   ├── api.js           # Open-Meteo calls
│   ├── weatherCodes.js  # WMO code → label/icon
│   └── style.css
└── tests/
    ├── mocks.ts         # network fixtures
    └── weather.spec.ts
```
