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

test.describe('Deposits API', () => {
  test('POST /deposits - successful deposit increases balance', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    // Make a deposit
    const depositResponse = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId,
        amount: 100.50,
        reference: 'Test deposit',
      },
    });
    
    expect(depositResponse.status()).toBe(201);
    
    const depositBody = await depositResponse.json();
    expect(depositBody).toHaveProperty('transactionId');
    expect(depositBody.newBalance).toBe(100.50);
    expect(typeof depositBody.transactionId).toBe('string');
    
    // Verify balance was updated
    const accountResponse = await request.get(`${BASE_URL}/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const accountBody = await accountResponse.json();
    expect(accountBody.balance).toBe(100.50);
  });
  
  test('POST /deposits - multiple deposits accumulate correctly', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    // First deposit
    await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId,
        amount: 50,
      },
    });
    
    // Second deposit
    const secondDeposit = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId,
        amount: 75.25,
      },
    });
    
    const body = await secondDeposit.json();
    expect(body.newBalance).toBe(125.25);
  });
  
  test('POST /deposits - amount <= 0 returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    const response = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId,
        amount: 0,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('greater than 0');
  });
  
  test('POST /deposits - negative amount returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    const response = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId,
        amount: -50,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
  
  test('POST /deposits - unknown account returns 404', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId: '00000000-0000-0000-0000-000000000000',
        amount: 100,
      },
    });
    
    expect(response.status()).toBe(404);
    
    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Account not found');
  });
  
  test('POST /deposits - missing token returns 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/deposits`, {
      data: {
        accountId: '00000000-0000-0000-0000-000000000000',
        amount: 100,
      },
    });
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
  
  test('POST /deposits - missing accountId returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        amount: 100,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('accountId');
  });
  
  test('POST /deposits - missing amount returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    const response = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId,
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('amount');
  });
  
  test('POST /deposits - deposit with reference works', async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);
    
    const response = await request.post(`${BASE_URL}/deposits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        accountId,
        amount: 200,
        reference: 'Salary payment',
      },
    });
    
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.newBalance).toBe(200);
  });
});
