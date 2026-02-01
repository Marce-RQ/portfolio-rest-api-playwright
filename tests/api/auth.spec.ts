import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('Auth API', () => {
  test('POST /auth/login - successful login returns token', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: 'demo@qa.com',
        password: 'demo123',
      },
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
  });
  
  test('POST /auth/login - invalid credentials returns 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: 'demo@qa.com',
        password: 'wrongpassword',
      },
    });
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Invalid credentials');
  });
  
  test('POST /auth/login - non-existent user returns 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: 'nonexistent@qa.com',
        password: 'demo123',
      },
    });
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
  
  test('POST /auth/login - missing email returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        password: 'demo123',
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
  
  test('POST /auth/login - missing password returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: 'demo@qa.com',
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
  
  test('GET /me - without token returns 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/me`);
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
  
  test('GET /me - with invalid token returns 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/me`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
  
  test('GET /me - with valid token returns user info', async ({ request }) => {
    // First login to get token
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: 'demo@qa.com',
        password: 'demo123',
      },
    });
    
    const { token } = await loginResponse.json();
    
    // Then call /me with token
    const response = await request.get(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body.email).toBe('demo@qa.com');
    expect(typeof body.id).toBe('string');
  });
});
