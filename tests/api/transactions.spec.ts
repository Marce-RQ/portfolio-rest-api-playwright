import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Helper function to get auth token
async function getAuthToken(request: any): Promise<string> {
  const response = await request.post(`${BASE_URL}/auth/login`, {
    data: {
      email: 'demo@qa.com',
      password: 'demo123',
    },
  });
  const { token } = await response.json();
  return token;
}

// Helper function to create an account
async function createAccount(request: any, token: string, currency = 'EUR'): Promise<string> {
  const response = await request.post(`${BASE_URL}/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      currency,
    },
  });
  const { id } = await response.json();
  return id;
}

// Helper function to make a deposit
async function makeDeposit(request: any, token: string, accountId: string, amount: number, reference?: string) {
  const response = await request.post(`${BASE_URL}/deposits`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      accountId,
      amount,
      reference,
    },
  });
  return response;
}

test.describe('Transactions API', () => {
  test('GET /transactions - returns transactions for account', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    // Create some deposits
    await makeDeposit(request, token, accountId, 100, 'First deposit');
    await makeDeposit(request, token, accountId, 50, 'Second deposit');
    
    // Get transactions
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('total');
    expect(body.items.length).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(body.total).toBe(2);
    
    // Check transaction structure
    const transaction = body.items[0];
    expect(transaction).toHaveProperty('id');
    expect(transaction).toHaveProperty('account_id');
    expect(transaction).toHaveProperty('type');
    expect(transaction).toHaveProperty('amount');
    expect(transaction).toHaveProperty('reference');
    expect(transaction).toHaveProperty('created_at');
    expect(transaction.type).toBe('deposit');
  });
  
  test('GET /transactions - returns only transactions for specified account', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId1 = await createAccount(request, token, 'EUR');
    const accountId2 = await createAccount(request, token, 'USD');
    
    // Create deposits for both accounts
    await makeDeposit(request, token, accountId1, 100);
    await makeDeposit(request, token, accountId2, 200);
    await makeDeposit(request, token, accountId1, 50);
    
    // Get transactions for account 1
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId1}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const body = await response.json();
    expect(body.total).toBe(2);
    expect(body.items.length).toBe(2);
    
    // All transactions should belong to account 1
    body.items.forEach((tx: any) => {
      expect(tx.account_id).toBe(accountId1);
    });
  });
  
  test('GET /transactions - respects limit parameter', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    // Create 5 deposits
    for (let i = 1; i <= 5; i++) {
      await makeDeposit(request, token, accountId, i * 10);
    }
    
    // Get transactions with limit 3
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&limit=3`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const body = await response.json();
    expect(body.items.length).toBe(3);
    expect(body.limit).toBe(3);
    expect(body.total).toBe(5);
  });
  
  test('GET /transactions - respects page parameter', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    // Create 5 deposits
    for (let i = 1; i <= 5; i++) {
      await makeDeposit(request, token, accountId, i * 10);
    }
    
    // Get page 2 with limit 2
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&page=2&limit=2`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const body = await response.json();
    expect(body.items.length).toBe(2);
    expect(body.page).toBe(2);
    expect(body.limit).toBe(2);
    expect(body.total).toBe(5);
  });
  
  test('GET /transactions - page beyond last returns empty items', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    // Create 2 deposits
    await makeDeposit(request, token, accountId, 100);
    await makeDeposit(request, token, accountId, 50);
    
    // Get page 10 (beyond last)
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&page=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.items.length).toBe(0);
    expect(body.total).toBe(2);
    expect(body.page).toBe(10);
  });
  
  test('GET /transactions - missing accountId returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.get(`${BASE_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('accountId');
  });
  
  test('GET /transactions - invalid page returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&page=0`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('page');
  });
  
  test('GET /transactions - invalid limit returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&limit=-1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('limit');
  });
  
  test('GET /transactions - limit exceeding 100 returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}&limit=101`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('100');
  });
  
  test('GET /transactions - unknown account returns 404', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.get(`${BASE_URL}/transactions?accountId=00000000-0000-0000-0000-000000000000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(404);
    
    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Account not found');
  });
  
  test('GET /transactions - missing token returns 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/transactions?accountId=00000000-0000-0000-0000-000000000000`);
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
  
  test('GET /transactions - transactions ordered by created_at descending', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    // Create deposits with references to track order
    await makeDeposit(request, token, accountId, 10, 'First');
    await makeDeposit(request, token, accountId, 20, 'Second');
    await makeDeposit(request, token, accountId, 30, 'Third');
    
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const body = await response.json();
    
    // Most recent should be first (descending order)
    expect(body.items[0].reference).toBe('Third');
    expect(body.items[1].reference).toBe('Second');
    expect(body.items[2].reference).toBe('First');
    
    // Verify timestamps are actually descending
    const timestamps = body.items.map((tx: any) => new Date(tx.created_at).getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }
  });
  
  test('GET /transactions - defaults work correctly', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    await makeDeposit(request, token, accountId, 100);
    
    // Don't specify page or limit
    const response = await request.get(`${BASE_URL}/transactions?accountId=${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });
});
