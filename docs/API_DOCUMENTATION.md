# Portfolio API - REST API Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:3000`  
**Authentication**: Bearer JWT Token

---

## Overview

This is a mini fintech REST API that provides account management and transaction functionality. It demonstrates:

- JWT authentication
- CRUD operations
- State mutations with database transactions
- Pagination
- Input validation
- Error handling

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Authentication](#authentication-endpoints)
   - [User](#user-endpoints)
   - [Accounts](#accounts-endpoints)
   - [Deposits](#deposits-endpoints)
   - [Transactions](#transactions-endpoints)
3. [Error Responses](#error-responses)
4. [Data Models](#data-models)

---

## Authentication

Most endpoints require authentication via JWT (JSON Web Token).

### How to authenticate:

1. **Login** to get a token:

   ```bash
   POST /auth/login
   ```

2. **Include token** in subsequent requests:
   ```
   Authorization: Bearer <your-token-here>
   ```

### Example:

```bash
# Get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@qa.com","password":"demo123"}'

# Use token
curl http://localhost:3000/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Endpoints

### Health Check

#### `GET /health`

Check if the API is running.

**Authentication**: None required

**Response**: `200 OK`

```json
{
  "status": "ok"
}
```

**Example**:

```bash
curl http://localhost:3000/health
```

---

### Authentication Endpoints

#### `POST /auth/login`

Authenticate a user and receive a JWT token.

**Authentication**: None required

**Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response**: `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:

- `401 Unauthorized` - Invalid credentials

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@qa.com",
    "password": "demo123"
  }'
```

**Demo User**:

- Email: `demo@qa.com`
- Password: `demo123`

---

### User Endpoints

#### `GET /me`

Get the authenticated user's information.

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "demo@qa.com"
}
```

**Error Responses**:

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

**Example**:

```bash
curl http://localhost:3000/me \
  -H "Authorization: Bearer <token>"
```

---

### Accounts Endpoints

#### `POST /accounts`

Create a new account for the authenticated user.

**Authentication**: Required

**Request Body**:

```json
{
  "currency": "EUR" | "USD"
}
```

**Success Response**: `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "currency": "EUR",
  "balance": 0
}
```

**Error Responses**:

- `400 Bad Request` - Invalid or missing currency

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Currency must be EUR or USD"
  }
}
```

- `401 Unauthorized` - Missing or invalid token

**Example**:

```bash
curl -X POST http://localhost:3000/accounts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "EUR"
  }'
```

**Notes**:

- New accounts start with balance of 0
- Only EUR and USD currencies are supported
- Each user can create multiple accounts

---

#### `GET /accounts/:id`

Get account details by ID.

**Authentication**: Required

**Path Parameters**:

- `id` (UUID) - Account ID

**Success Response**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "currency": "EUR",
  "balance": 150.5
}
```

**Error Responses**:

- `404 Not Found` - Account doesn't exist or doesn't belong to user

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Account not found"
  }
}
```

- `401 Unauthorized` - Missing or invalid token

**Example**:

```bash
curl http://localhost:3000/accounts/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <token>"
```

**Security**:

- Users can only access their own accounts
- Attempting to access another user's account returns 404

---

### Deposits Endpoints

#### `POST /deposits`

Make a deposit to an account.

**Authentication**: Required

**Request Body**:

```json
{
  "accountId": "string (UUID)",
  "amount": "number (positive)",
  "reference": "string (optional)"
}
```

**Success Response**: `201 Created`

```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440002",
  "newBalance": 250.5
}
```

**Error Responses**:

- `400 Bad Request` - Invalid input

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amount must be greater than 0"
  }
}
```

Common validation errors:

- `accountId is required`
- `amount must be a number`
- `amount must be greater than 0`

- `404 Not Found` - Account doesn't exist

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Account not found"
  }
}
```

- `403 Forbidden` - Account belongs to another user

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this account"
  }
}
```

- `401 Unauthorized` - Missing or invalid token

**Example**:

```bash
curl -X POST http://localhost:3000/deposits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 100.50,
    "reference": "Salary payment"
  }'
```

**Notes**:

- Amount must be greater than 0
- Creates a transaction record and updates account balance atomically
- Reference is optional (can be used for notes/descriptions)
- Deposits are processed immediately (no async processing)

---

### Transactions Endpoints

#### `GET /transactions`

Get a paginated list of transactions for an account.

**Authentication**: Required

**Query Parameters**:

- `accountId` (UUID, **required**) - Account to get transactions for
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20, max: 100)

**Success Response**: `200 OK`

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "account_id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "deposit",
      "amount": "100.50",
      "reference": "Salary payment",
      "created_at": "2026-01-15T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "account_id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "deposit",
      "amount": "50.00",
      "reference": null,
      "created_at": "2026-01-14T15:20:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 2
}
```

**Error Responses**:

- `400 Bad Request` - Invalid parameters

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "accountId is required"
  }
}
```

Common validation errors:

- `accountId is required`
- `page must be a positive integer`
- `limit must be a positive integer`
- `limit cannot exceed 100`

- `404 Not Found` - Account doesn't exist

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Account not found"
  }
}
```

- `403 Forbidden` - Account belongs to another user
- `401 Unauthorized` - Missing or invalid token

**Example**:

```bash
# Get first page (default)
curl "http://localhost:3000/transactions?accountId=550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer <token>"

# Get second page with 10 items per page
curl "http://localhost:3000/transactions?accountId=550e8400-e29b-41d4-a716-446655440001&page=2&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Notes**:

- Transactions are ordered by `created_at` DESC (newest first)
- If page is beyond the last page, returns empty items array
- Maximum limit is 100 items per page
- Use `total` to calculate total pages: `Math.ceil(total / limit)`

---

## Error Responses

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Error Codes

| Status | Code               | Description                       |
| ------ | ------------------ | --------------------------------- |
| 400    | `VALIDATION_ERROR` | Invalid input data                |
| 401    | `UNAUTHORIZED`     | Missing or invalid authentication |
| 403    | `FORBIDDEN`        | Authenticated but not authorized  |
| 404    | `NOT_FOUND`        | Resource doesn't exist            |
| 500    | `INTERNAL_ERROR`   | Server error                      |

### Common Error Scenarios

#### Missing Authentication

```bash
# Request without token
curl http://localhost:3000/me

# Response
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authorization header"
  }
}
```

#### Invalid Token

```bash
# Request with invalid token
curl http://localhost:3000/me \
  -H "Authorization: Bearer invalid-token"

# Response
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

#### Validation Error

```bash
# Request with invalid data
curl -X POST http://localhost:3000/accounts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currency":"GBP"}'

# Response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Currency must be EUR or USD"
  }
}
```

#### Resource Not Found

```bash
# Request for non-existent resource
curl http://localhost:3000/accounts/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <token>"

# Response
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Account not found"
  }
}
```

---

## Data Models

### User

```typescript
{
  id: string(UUID);
  email: string;
  created_at: timestamp;
}
```

### Account

```typescript
{
  id: string (UUID)
  user_id: string (UUID, references User)
  currency: "EUR" | "USD"
  balance: number (decimal, 2 places)
  created_at: timestamp
}
```

### Transaction

```typescript
{
  id: string (UUID)
  account_id: string (UUID, references Account)
  type: "deposit"
  amount: string (numeric, preserves precision)
  reference: string | null
  created_at: timestamp
}
```

**Note**: In Phase 1, only "deposit" type is supported. Future versions may add "withdrawal" and "transfer" types.

---

## Getting Started

### 1. Start the API

```bash
docker compose up -d
```

### 2. Verify it's running

```bash
curl http://localhost:3000/health
```

### 3. Login

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@qa.com","password":"demo123"}' | jq -r '.token')

echo $TOKEN
```

### 4. Create an account

```bash
ACCOUNT_ID=$(curl -s -X POST http://localhost:3000/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currency":"EUR"}' | jq -r '.id')

echo $ACCOUNT_ID
```

### 5. Make a deposit

```bash
curl -X POST http://localhost:3000/deposits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"amount\": 100,
    \"reference\": \"Test deposit\"
  }" | jq
```

### 6. View transactions

```bash
curl "http://localhost:3000/transactions?accountId=$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 7. Check balance

```bash
curl "http://localhost:3000/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Testing

### Run automated tests

```bash
npm test
```

### Run specific test file

```bash
npm test tests/api/accounts.spec.ts
```

### See test report

```bash
npx playwright show-report
```

---

## Rate Limiting

**Current version**: No rate limiting implemented.

**Best practices** for production:

- Implement rate limiting per IP/user
- Typical limits: 100 requests per minute per user
- Return `429 Too Many Requests` when exceeded

---

## Versioning

**Current version**: 1.0.0

API versioning strategy (for future):

- URL versioning: `/v1/accounts`, `/v2/accounts`
- Or header versioning: `Accept: application/vnd.api.v1+json`

---

## Support & Contributing

- **Issues**: Report bugs or request features via GitHub Issues
- **Tests**: Add Playwright tests for any new features
- **Documentation**: Update this file when adding endpoints
- **Code style**: Follow existing patterns (TypeScript, Express)

---

## Additional Resources

- **PRD**: `docs/PRD.md` - Full requirements document
- **Learning Guides**: `docs/PHASE_*_LEARNING_GUIDE.md` - Implementation walkthroughs
- **QA Guide**: `docs/QA_TESTING_GUIDE.md` - How to test REST APIs
- **Tests**: `tests/api/*.spec.ts` - Example API tests

---

## Changelog

### v1.0.0 (February 2026)

- Initial release
- Authentication (JWT)
- Account management (create, read)
- Deposits
- Transaction history with pagination
- 40 automated tests

---

**Last Updated**: February 1, 2026
