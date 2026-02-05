import { test, expect } from '@playwright/test';
import { getAuthToken } from '../helpers/index';
const BASE_URL = process.env.API_BASE_URL;

test.describe('Accounts Endpoint', () => {
  test.describe('Happy Path', () => {
    test('POST /accounts: create EUR account returns 201, id, currency, balance=0)', async ({ request }) => {
      // First, obtaining JWT token
      const token = await getAuthToken(request);

      // Then call /accounts with token
      const response = await request.post(`${BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { currency: 'EUR' },
      });
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('currency');
      expect(body).toHaveProperty('balance');
      expect(body.currency).toBe('EUR');
      expect(body.balance).toEqual(0);
    });

    test('POST /accounts: create USD account returns 201, id, currency, balance', async ({ request }) => {
      const token = await getAuthToken(request);

      const response = await request.post(`${BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { currency: 'USD' },
      });
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body).toMatchObject({
        id: expect.any(String),
        currency: expect.any(String),
        balance: expect.any(Number),
      });
    });

    test('GET /accounts/:id retrieve an existing account details', async ({ request }) => {
      // First create new account
      const token = await getAuthToken(request);
      const createResponse = await request.post(`${BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { currency: 'EUR' },
      });
      const createdAccount = await createResponse.json();

      // Fetch & Assert newly created account
      const response = await request.get(`${BASE_URL}/accounts/${createdAccount.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { id, currency, balance } = await response.json();
      expect(response.status()).toBe(200);
      expect(id).toBe(createdAccount.id);
    });
  });

  test.describe('Validation and Error Handling', () => {
    test('POST /accounts: invalid currency (GBP) returns 400 and error message', async ({ request }) => {
      const token = await getAuthToken(request);

      const response = await request.post(`${BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { currency: 'GBP' },
      });
      const body = await response.json();

      expect(response.status()).toBe(400);
      expect(body.error.message).toBe('Currency must be EUR or USD');
    });

    test('POST /accounts: missing currency returns 400 and validation error', async ({ request }) => {
      const token = await getAuthToken(request);

      const response = await request.post(`${BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {},
      });
      const body = await response.json();

      expect(response.status()).toBe(400);
      expect(body.error.message).toBe('Currency is required');
    });

    test('POST /accounts: request with invalid token returns 401 (UNAUTHORIZED)', async ({ request }) => {
      const invalidToken = 'fakeToken123';

      const response = await request.post(`${BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${invalidToken}` },
        data: { currency: 'USD' },
      });
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body.error.message).toBe('Invalid or expired token');
    });

    test('GET /accounts/:id: request without token returns 401 (UNAUTHORIZED)', async ({ request }) => {
      const token = await getAuthToken(request);
      const postResponse = await request.post(`${BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { currency: 'EUR' },
      });
      const { id } = await postResponse.json();

      const response = await request.get(`${BASE_URL}/accounts/${id}`, {
        headers: { Authorization: `` },
      });
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body.error.message).toBe('Missing or invalid authorization header');
    });

    test('GET /accounts/:id: invalid account id returns 404 (NOT_FOUND)', async ({ request }) => {
      const token = await getAuthToken(request);
      const invalidAccountId = '11111111-2222-3333-44b4-55fe55555a55';
      const response = await request.get(`${BASE_URL}/accounts/${invalidAccountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();

      expect(response.status()).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Account not found');
    });
  });
});
