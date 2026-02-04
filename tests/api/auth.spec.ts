import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

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

  test.describe('Negative', () => {
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

    test('POST /auth/login: missing password returns 400 (VALIDATION_ERROR)', async ({
      request,
    }) => {
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
      // First, obtain a token with short expiry (set to 5s in auth.ts)
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: 'demo@qa.com',
          password: 'demo123',
        },
      });
      // Verify token works
      expect(response.status()).toBe(200);
      const bodyPost = await response.json();

      // Wait for token to expire (token expiry set to 10s in auth.ts)
      await new Promise((resolve) => setTimeout(resolve, 6_000));

      // Now call GET /me with expired token
      const responseMe = await request.get(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${bodyPost.token}`,
        },
      });
      const bodyGet = await responseMe.json();

      expect(responseMe.status()).toBe(401);
      expect(bodyGet.error.code).toBe('UNAUTHORIZED');
      expect(bodyGet.error.message).toContain('Invalid or expired token');
    });
  });
});
