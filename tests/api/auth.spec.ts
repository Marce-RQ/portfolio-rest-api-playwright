import { test, expect } from '@playwright/test';
import {getAuthToken} from '../helpers/auth-helpers';
import jwt from 'jsonwebtoken';
const BASE_URL = process.env.API_BASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

test.describe('Auth Endpoint', () => {
  test.describe('Happy Path', () => {
    test('POST /auth/login: returns 200 and Token', async ({ request }) => {
      // First, obtaining JWT token
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: 'demo@qa.com',
          password: 'demo123',
        },
      });
      const body = await response.json();
      
      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
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
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(typeof body.id).toBe('string');
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
      const body = await response.json();
      
      expect(response.status()).toBe(401);
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
      // Login to get a valid token
      const validToken = await getAuthToken(request);
      const meResponse = await request.get(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });
      // Extracting the userId
      const {id : userId} = await meResponse.json();
      
      if (!JWT_SECRET) {
        throw new Error('Check that your JWT_SECRET is set in the .env file');
      }
      
      // Create expired token with real user ID
      const expiredToken = jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: '-1h' } // Negative time = expired an hour ago
      );
      
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
