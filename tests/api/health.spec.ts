import { test, expect } from '@playwright/test';

test.describe('Health Endpoint', () => {
  test('GET /health returns 200 with status ok', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ status: 'ok' });
  });

  test('/health response content-type is application/json', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('GET /health should timeout when service is unavailable', async ({ playwright }) => {
    const invalidRequest = playwright.request.newContext({
      baseURL: 'http://localhost:9999',
      timeout: 2000, // Set quick timeout (2 seconds)
    });

    await expect(async () => {
      await (await invalidRequest).get('/health');
    }).rejects.toThrow();

    // "invalidRequest" Overrides the default request context with a non-responsive service
    // Assertion: expect use "await" when a promise is returned (.rejects, .resolves), OR locators expect(page.locator('#status')).toHaveText('Success')
    // .rejects.toThrow();  Both are needed API request to a down service
    //  ↑         ↑
    //  |         └─ Expects any error to be thrown
    //  └─────────── Expects the Promise to reject
  });
});
