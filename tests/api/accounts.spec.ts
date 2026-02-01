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

test.describe('Accounts API', () => {
  test('POST /accounts - create account with EUR currency', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.post(`${BASE_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        currency: 'EUR',
      },
    });
    
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.currency).toBe('EUR');
    expect(body.balance).toBe(0);
    expect(typeof body.id).toBe('string');
  });
  
  test('POST /accounts - create account with USD currency', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.post(`${BASE_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        currency: 'USD',
      },
    });
    
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.currency).toBe('USD');
    expect(body.balance).toBe(0);
  });
  
  test('POST /accounts - invalid currency returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.post(`${BASE_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        currency: 'GBP',
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('EUR or USD');
  });
  
  test('POST /accounts - missing currency returns 400', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const response = await request.post(`${BASE_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {},
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
  
  test('POST /accounts - without token returns 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/accounts`, {
      data: {
        currency: 'EUR',
      },
    });
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
  
  test('GET /accounts/:id - retrieve existing account', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // First create an account
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        currency: 'EUR',
      },
    });
    
    const createdAccount = await createResponse.json();
    
    // Then fetch it by ID
    const response = await request.get(`${BASE_URL}/accounts/${createdAccount.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.id).toBe(createdAccount.id);
    expect(body.currency).toBe('EUR');
    expect(body.balance).toBe(0);
  });
  
  test('GET /accounts/:id - non-existent account returns 404', async ({ request }) => {
    const token = await getAuthToken(request);
    
    const fakeId = '00000000-0000-0000-0000-000000000000';
    
    const response = await request.get(`${BASE_URL}/accounts/${fakeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(404);
    
    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });
  
  test('GET /accounts/:id - without token returns 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/accounts/some-id`);
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
  
  test('Create account then fetch it by ID (integration test)', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // Create account
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        currency: 'USD',
      },
    });
    
    expect(createResponse.status()).toBe(201);
    const createdAccount = await createResponse.json();
    
    // Fetch account
    const getResponse = await request.get(`${BASE_URL}/accounts/${createdAccount.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(getResponse.status()).toBe(200);
    const fetchedAccount = await getResponse.json();
    
    // Verify they match
    expect(fetchedAccount.id).toBe(createdAccount.id);
    expect(fetchedAccount.currency).toBe(createdAccount.currency);
    expect(fetchedAccount.balance).toBe(createdAccount.balance);
  });
});
