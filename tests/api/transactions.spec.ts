import { test, expect } from '@playwright/test';
import { getAuthToken, createAccount, makeDeposit } from '../helpers/index';
const BASE_URL = process.env.API_BASE_URL;

test.describe('Transactions Endpoint', () => {
  test.describe('Happy Path', () => {
    test('GET /transactions: returns 200, with items, page(default=1), limit(default=20), total', async ({ request }) => {
      // Create account with 2 transactions
      const token = await getAuthToken(request);
      const accountId = await createAccount(request, token, 'EUR');
      await makeDeposit(request, token, accountId, 100, 'First deposit');
      await makeDeposit(request, token, accountId, 200, 'Second deposit');

      // Fetch transactions
      const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.items.length).toBe(2);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
      expect(body.total).toBe(2);
    });

    test('Transaction Object shape: id, account_id, type, amount, reference, created_at', async ({ request }) => {
      // Create account with 1 transaction
      const token = await getAuthToken(request);
      const accountId = await createAccount(request, token, 'EUR');
      await makeDeposit(request, token, accountId, 150, 'Salary payment');

      // Fetch transactions
      const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      const transaction = body.items[0];

      expect(response.status()).toBe(200);
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('account_id');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('reference');
      expect(transaction).toHaveProperty('created_at');
    });

    test('Filtering: only transactions for the specified account are returned', async ({ request }) => {
      // Create 2 accounts with transactions
      const token = await getAuthToken(request);

      const eurAccountId = await createAccount(request, token, 'EUR');
      const amountEur = Math.round((Math.random() * (100 - 1) + 1) * 100) / 100; // Random amount between 1 and 100 with 2 decimals

      const usdAccountId = await createAccount(request, token, 'USD');
      const amountUsd = Math.round((Math.random() * (1000 - 100) + 100) * 100) / 100; // Random amount between 100 and 1000 with 2 decimals

      await makeDeposit(request, token, eurAccountId, amountEur, 'Deposit to EUR account');
      await makeDeposit(request, token, usdAccountId, amountUsd, 'Deposit to USD account');

      // Fetch transactions for EUR account
      const responseEur = await request.get(`${BASE_URL}/transactions?accountId=${eurAccountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bodyEur = await responseEur.json();

      expect(bodyEur.items[0].account_id).toBe(eurAccountId);
      expect(bodyEur.items[0].amount).toBe(amountEur.toFixed(2));
      expect(bodyEur.items[0].reference).toBe('Deposit to EUR account');

      // Fetch transactions for USD account
      const responseUsd = await request.get(`${BASE_URL}/transactions?accountId=${usdAccountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bodyUsd = await responseUsd.json();
      expect(bodyUsd.items[0].account_id).toBe(usdAccountId);
      expect(bodyUsd.items[0].amount).toBe(amountUsd.toFixed(2));
      expect(bodyUsd.items[0].reference).toBe('Deposit to USD account');
    });

    test('Limit parameter: limit=3 returns 3 items)', async ({ request }) => {
      // Create account with 5 transactions
      const token = await getAuthToken(request);
      const accountId = await createAccount(request, token);
      for (let i = 1; i <= 5; i++) {
        await makeDeposit(request, token, accountId, i * 10, `Deposit# ${i}`);
      }

      // Fetch transactions with limit=3
      const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&limit=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.items.length).toBe(3);
      expect(body.limit).toBe(3);
      expect(body.total).toBe(5);
    });

    test('Pagination & Sorting: Correct subsets is returned and ordered by "created_at" descending', async ({ request }) => {
      // Create account with 10 transactions
      const token = await getAuthToken(request);
      const accountId = await createAccount(request, token);
      for (let i = 1; i <= 10; i++) {
        await makeDeposit(request, token, accountId, i * 10, `Deposit# ${i}`);
      }
      // Fetch page 1 with limit=5 (transactions 10-6)
      const responsePage1 = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&page=1&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bodyPage1 = await responsePage1.json();

      expect(bodyPage1.page).toBe(1);
      expect(bodyPage1.limit).toBe(5);
      expect(bodyPage1.total).toBe(10);
      expect(bodyPage1.items[0].reference).toBe('Deposit# 10'); // Newest transaction first

      // Fetch page 2 with limit=5 (transactions 5-1)
      const responsePage2 = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&page=2&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bodyPage2 = await responsePage2.json();

      expect(bodyPage2.page).toBe(2);
      expect(bodyPage2.limit).toBe(5);
      expect(bodyPage2.total).toBe(10);
      expect(bodyPage2.items[0].reference).toBe('Deposit# 5'); // 5th transaction is the first item on page 2
    });

    test('GET /transactions: Page beyond last returns empty items array', async ({ request }) => {
      // Create account with 3 transactions
      const token = await getAuthToken(request);
      const accountId = await createAccount(request, token);
      for (let i = 1; i <= 3; i++) {
        await makeDeposit(request, token, accountId, i * 10, `Deposit# ${i}`);
      }

      // Fetch page 2 with limit=5 (beyond last page)
      const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&page=2&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bodyPage2 = await response.json();
      expect(response.status()).toBe(200);
      expect(bodyPage2.items.length).toBe(0);
      expect(bodyPage2.page).toBe(2);
      expect(bodyPage2.limit).toBe(5);
      expect(bodyPage2.total).toBe(3);
    });
  });

  test('GET /transactions: defaults (page=1, limit=20) work correctly', async ({ request }) => {
    // Create account with 25 transactions
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    for (let i = 1; i <= 25; i++) {
      await makeDeposit(request, token, accountId, i * 10, `Deposit# ${i}`);
    }

    // Fetch transactions without page & limit (should default to page=1, limit=20)
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    expect(response.status()).toBe(200);
    expect(body.items.length).toBe(20); // Default limit is 20
    expect(body.page).toBe(1); // Default page is 1
    expect(body.limit).toBe(20);
    expect(body.total).toBe(25);
  });
});

test.describe('Validation and Error Handling', () => {
  test('GET /transactions: invalid token returns 401 (UNAUTHORIZED)', async ({ request }) => {
    const invalidToken = 'fakeToken123';

    const response = await request.get(`${BASE_URL}/transactions?accountId=some-id`, {
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    const body = await response.json();
    expect(response.status()).toBe(401);
    expect(body.error.message).toBe('Invalid or expired token');
  });

  test('GET /transactions: missing accountId returns 400 (VALIDATION_ERROR)', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.get(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('accountId is required');
  });

  test('GET /transactions: invalid page values return 400', async ({ request }) => {
    const token = await getAuthToken(request); // Endpoint validates the request before checking if account exists, so we can use fake accountId for this test

    // Invalid page (negative number -1)
    const response = await request.get(`${BASE_URL}/transactions?accountId=some-id&page=-1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error.message).toContain('page must be a positive integer');
  });

  test('GET /transactions: invalid limit values return 400', async ({ request }) => {
    const token = await getAuthToken(request);

    // Invalid limit (zero)
    const response = await request.get(`${BASE_URL}/transactions?accountId=some-id&limit=0`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error.message).toContain('limit must be a positive integer');
  });

  test('GET /transactions: limit exceeding maximum (e.g., 100) returns 400', async ({ request }) => {
    const token = await getAuthToken(request);

    // Limit exceeding maximum (e.g., 101)
    const response = await request.get(`${BASE_URL}/transactions?accountId=some-id&limit=101`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error.message).toContain('limit cannot exceed 100');
  });

  test('GET /transactions: unknown accountId returns 404 (NOT_FOUND)', async ({ request }) => {
    const token = await getAuthToken(request);
    const unknownAccountId = '11111111-2222-3333-44b4-55fe55555a55'; // Random UUID that doesn't exist in the system

    const response = await request.get(`${BASE_URL}/transactions?accountId=${unknownAccountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Account not found');
  });

  test('GET /transactions: user cannot access another user account - returns 403 FORBIDDEN', async ({ request }) => {
    // Create account for user1
    const tokenUser1 = await getAuthToken(request, 'demo@qa.com', 'demo123');
    const accountId = await createAccount(request, tokenUser1);
    await makeDeposit(request, tokenUser1, accountId, 100, 'User1 deposit');
    
    // Verify user1 can access their own transactions
    const user1Response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const user1Body = await user1Response.json();
    expect(user1Response.status()).toBe(200);
    expect(user1Body.items[0].reference).toBe('User1 deposit');

    // Try to fetch user1's transactions using user2's token
    const tokenUser2 = await getAuthToken(request, 'second-demo@qa.com', 'demo123');
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    const body = await response.json();

    expect(response.status()).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toBe('You do not have access to this account');
  });

  test('GET /transactions: missing token returns 401 (UNAUTHORIZED)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/transactions?accountId=some-id`, {
      headers: { Authorization: `` },
    });
    const body = await response.json();
    expect(response.status()).toBe(401);
    expect(body.error.message).toBe('Missing or invalid authorization header');
  });
});
