import { test, expect } from '@playwright/test';
const BASE_URL = process.env.API_BASE_URL;

test.describe('Auth Endpoint', () => {
  test.describe('Happy Path', () => {
    test('POST /auth/login: returns 200 and Token', async ({ request }) => {
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

    test('GET /me: with valid token returns 200 and user info (id, email)', async ({ request }) => {
      // First, obtaining JWT token
      const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: 'demo@qa.com',
          password: 'demo123',
        },
      });

      const bodyPost = await loginResponse.json();

      // Then call /me with token
      const response = await request.get(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${bodyPost.token}`,
        },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(typeof body.id).toBe('string');
      expect(body.id.length).toBeGreaterThan(0);

      expect(typeof body.email).toBe('string');
      expect(body.email).toBe('demo@qa.com');
    });
  });

  test.describe('Validation and Error Handling', () => {
    test('POST /auth/login: invalid credentials return 401, UNAUTHORIZED', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: 'demo@qa.com',
          password: 'WrongPassword',
        },
      });
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toContain('Invalid credentials');
    });

    test('POST /auth/login: non-existent user returns 401, UNAUTHORIZED', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: 'not-a-registered-user@qa.com',
          password: 'random123',
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    test('POST /auth/login: missing email returns 400 (VALIDATION_ERROR)', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: '',
          password: 'demo123',
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(400);
      expect(body.error.message).toContain('Email and password are required');
    });

    test('POST /auth/login: missing password returns 400 (VALIDATION_ERROR)', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: 'demo@qa.com',
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(400);
      expect(body.error.message).toContain('Email and password are required');
    });

    test('GET /me: without token returns 401 (UNAUTHORIZED)', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer `,
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body.error.message).toContain('Missing or invalid authorization header');
    });

    test('should reject expired token ', async ({ request }) => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3OTg5MjdhMC1lYTkxLTRlNGEtYjlhNi05N2Q2MzdlNTA0OGYiLCJpYXQiOjE3NzAyMzA3MzIsImV4cCI6MTc3MDIzMDczN30.egThWjoJD7IIZbRXBrjf2o8mtg7Gdaq_hZSYAIEEyJ4';
      const response = await request.get(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toContain('Invalid or expired token');
    });
  });
});
