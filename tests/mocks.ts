import { Page } from '@playwright/test';

export const chennaiGeo = {
  results: [{ name: 'Chennai', country: 'India', latitude: 13.08, longitude: 80.27 }],
};

export function forecast(unit: 'celsius' | 'fahrenheit' = 'celsius') {
  const t = (c: number) => (unit === 'celsius' ? c : c * 1.8 + 32);
  return {
    current: { temperature_2m: t(31.4), relative_humidity_2m: 70, weather_code: 2, wind_speed_10m: 14.6 },
    daily: {
      time: ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'],
      weather_code: [2, 61, 63, 0, 95],
      temperature_2m_max: [32, 30, 29, 33, 28].map(t),
      temperature_2m_min: [25, 24, 24, 26, 23].map(t),
    },
  };
}

/** Route Open-Meteo calls to fixtures so tests are fast and deterministic. */
export async function mockWeatherApi(page: Page, opts: { geo?: object; geoStatus?: number; forecastStatus?: number } = {}) {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ status: opts.geoStatus ?? 200, json: opts.geo ?? chennaiGeo }),
  );
  await page.route('**/api.open-meteo.com/v1/forecast**', (route) => {
    const unit = new URL(route.request().url()).searchParams.get('temperature_unit') as 'celsius' | 'fahrenheit';
    return route.fulfill({ status: opts.forecastStatus ?? 200, json: forecast(unit) });
  });
}
