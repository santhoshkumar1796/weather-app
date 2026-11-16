import { test, expect, Page } from '@playwright/test';
import { mockWeatherApi } from './mocks';

async function searchCity(page: Page, city: string) {
  await page.getByLabel('City').fill(city);
  await page.getByRole('button', { name: 'Search' }).click();
}

test.describe('Weather search', () => {
  test('shows current weather and 5-day forecast', async ({ page }) => {
    await mockWeatherApi(page);
    await page.goto('/');
    await searchCity(page, 'Chennai');

    await expect(page.getByTestId('location')).toHaveText('Chennai, India');
    await expect(page.getByTestId('temperature')).toHaveText('31°C');
    await expect(page.getByTestId('condition')).toHaveText('Partly cloudy');
    await expect(page.getByTestId('humidity')).toHaveText('70%');
    await expect(page.getByTestId('wind')).toHaveText('15 km/h');
    await expect(page.getByTestId('forecast').locator('li')).toHaveCount(5);
  });

  test('sends the searched city to the geocoding API', async ({ page }) => {
    await mockWeatherApi(page);
    await page.goto('/');
    const request = page.waitForRequest('**/geocoding-api.open-meteo.com/**');
    await searchCity(page, 'New York');
    expect(new URL((await request).url()).searchParams.get('name')).toBe('New York');
  });

  test('switches to Fahrenheit', async ({ page }) => {
    await mockWeatherApi(page);
    await page.goto('/');
    await searchCity(page, 'Chennai');
    await expect(page.getByTestId('temperature')).toHaveText('31°C');

    await page.getByRole('button', { name: '°F' }).click();
    await expect(page.getByTestId('temperature')).toHaveText('89°F');
    await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('remembers recent searches across reloads', async ({ page }) => {
    await mockWeatherApi(page);
    await page.goto('/');
    await searchCity(page, 'Chennai');
    await expect(page.getByTestId('location')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('recent').getByRole('button', { name: 'Chennai' })).toBeVisible();
  });
});

test.describe('Error handling', () => {
  test('unknown city shows a friendly message', async ({ page }) => {
    await mockWeatherApi(page, { geo: { results: [] } });
    await page.goto('/');
    await searchCity(page, 'Atlantis');

    await expect(page.getByTestId('status')).toHaveText('No city found for "Atlantis".');
    await expect(page.getByTestId('current')).toBeHidden();
  });

  test('forecast API failure is reported', async ({ page }) => {
    await mockWeatherApi(page, { forecastStatus: 500 });
    await page.goto('/');
    await searchCity(page, 'Chennai');

    await expect(page.getByTestId('status')).toHaveText('Weather service is unavailable. Please try again later.');
  });

  test('network failure is reported', async ({ page }) => {
    await page.route('**/geocoding-api.open-meteo.com/**', (route) => route.abort());
    await page.goto('/');
    await searchCity(page, 'Chennai');

    await expect(page.getByTestId('status')).toHaveText('Something went wrong. Check your connection.');
  });
});
