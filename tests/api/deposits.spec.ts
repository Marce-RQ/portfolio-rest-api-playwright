import { test, expect } from '@playwright/test';
import { getAuthToken, createAccount } from '../helpers/index';
const BASE_URL = process.env.API_BASE_URL;

test.describe('Deposits Endpoint', () => {
  test.describe('Happy Path', () => {
    test('POST /deposits: successful deposit returns transactionId and newBalance', async ({ request }) => {
      const token = await getAuthToken(request);
      const accountResult = await createAccount(request, token, 'EUR');
      const accountId = accountResult.body.id;
      const amount = 100.5;

      // Make a deposit
      const response = await request.post(`${BASE_URL}/deposits`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          accountId: accountId,
          amount: amount,
          reference: `Test deposit`,
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(typeof body.transactionId).toBe('string');
      expect(body.balance).toBe(amount.toFixed(2));
    });

    test('POST /deposits: multiple deposits accumulate correctly', async ({ request }) => {
      const token = await getAuthToken(request);
      const accountResult = await createAccount(request, token, 'EUR');
      const accountId = accountResult.body.id;

      // First deposit
      const firstDepositResponse = await request.post(`${BASE_URL}/deposits`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          accountId: accountId,
          amount: 40,
          reference: `First deposit`,
        },
      });
      const firstDepositBody = await firstDepositResponse.json();
      expect(firstDepositResponse.status()).toBe(201);
      expect(firstDepositBody.balance).toBe('40.00');

      // Second deposit
      const secondDepositResponse = await request.post(`${BASE_URL}/deposits`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          accountId: accountId,
          amount: 60,
          reference: `Second deposit`,
        },
      });
      const secondDepositBody = await secondDepositResponse.json();
      expect(secondDepositResponse.status()).toBe(201);
      expect(secondDepositBody.balance).toBe('100.00');
    });

    test.describe('Validation and Error Handling', () => {
      test('POST /deposits: amount = 0 returns 400 with VALIDATION_ERROR and helpful message', async ({
        request,
      }) => {
        const token = await getAuthToken(request);
        const accountResult = await createAccount(request, token, 'EUR');
        const accountId = accountResult.body.id;
        const amount = 0;

        const response = await request.post(`${BASE_URL}/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            accountId: accountId,
            amount: amount,
          },
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('amount must be greater than 0');
      });

      test('POST /deposits: negative amount returns 400 with VALIDATION_ERROR and helpful message', async ({
        request,
      }) => {
        const token = await getAuthToken(request);
        const accountResult = await createAccount(request, token, 'EUR');
        const accountId = accountResult.body.id;
        const amount = -10;

        const response = await request.post(`${BASE_URL}/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            accountId: accountId,
            amount: amount,
          },
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('amount must be greater than 0');
      });

      test('POST /deposits: missing accountId returns 400 with VALIDATION_ERROR', async ({ request }) => {
        const token = await getAuthToken(request);
        const amount = 50;

        const response = await request.post(`${BASE_URL}/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { amount },
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('accountId is required');
      });

      test('POST /deposits: unknown accountId returns 404 with helpful message', async ({ request }) => {
        const token = await getAuthToken(request);
        const unknownAccountId = '11111111-2222-3333-44b4-55fe55555a55';

        const response = await request.post(`${BASE_URL}/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            accountId: unknownAccountId,
            amount: 50,
          },
        });
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toBe('Account not found');
      });

      test('POST /deposits: user cannot deposit to another user account - returns 403 FORBIDDEN', async ({
        request,
      }) => {
        // Create account for user1
        const user1Token = await getAuthToken(request);
        const user1AccountResult = await createAccount(request, user1Token, 'EUR');
        const user1AccountId = user1AccountResult.body.id;

        // Get token for different user
        const user2Token = await getAuthToken(request, 'second-demo@qa.com', 'demo123');

        // Try deposit to user1's account using user2's token
        const response = await request.post(`${BASE_URL}/deposits`, {
          headers: { Authorization: `Bearer ${user2Token}` },
          data: {
            accountId: user1AccountId,
            amount: 50,
            reference: 'Cross-user deposit attempt',
          },
        });
        const body = await response.json();

        expect(response.status()).toBe(403);
        expect(body.error.code).toBe('FORBIDDEN');
        expect(body.error.message).toBe('You do not have access to this account');
      });

      test('POST /deposits: missing amount returns 400 with helpful message', async ({ request }) => {
        const token = await getAuthToken(request);
        const accountResult = await createAccount(request, token);
        const accountId = accountResult.body.id;

        const response = await request.post(`${BASE_URL}/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { accountId },
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.error.message).toBe('amount must be a number');
      });

      test('POST /deposits: deposit with "string as amount" returns 400 with helpful message', async ({
        request,
      }) => {
        const token = await getAuthToken(request);
        const accountResult = await createAccount(request, token);
        const accountId = accountResult.body.id;

        const response = await request.post(`${BASE_URL}/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { accountId, amount: 'string-amount' },
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.error.message).toBe('amount must be a number');
      });

      test('POST /deposits: missing token returns 401 with UNAUTHORIZED', async ({ request }) => {
        const authResponse = await getAuthToken(request);
        const accountResult = await createAccount(request, authResponse.token);
        const accountId = accountResult.body.id;

        const response = await request.post(`${BASE_URL}/deposits`, {
          data: {
            accountId,
            amount: 50,
          },
        });
        const body = await response.json();

        expect(response.status()).toBe(401);
        expect(body.error.code).toBe('UNAUTHORIZED');
        expect(body.error.message).toBe('Missing or invalid authorization header');
      });
    });

    test('POST /deposits: invalid token returns 401 with UNAUTHORIZED', async ({ request }) => {
      const authResponse = await getAuthToken(request);
      const accountResult = await createAccount(request, authResponse.token);
      const accountId = accountResult.body.id;

      const response = await request.post(`${BASE_URL}/deposits`, {
        headers: { Authorization: `Bearer invalid-token` },
        data: {
          accountId,
          amount: 50,
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('Invalid or expired token');
    });
  });
});
