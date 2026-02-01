/**
 * Example tests demonstrating database validation
 * 
 * This file shows how to combine API testing with database validation
 * to ensure data is correctly persisted and maintained.
 */

import { test, expect } from '@playwright/test';
import { dbHelpers, dbCleanup } from '../helpers/db-helpers';

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

test.describe('Database Validation Examples', () => {
  
  test('Example 1: Verify user exists in database', async ({ request }) => {
    // API Test: Login
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: 'demo@qa.com',
        password: 'demo123',
      },
    });
    
    expect(response.status()).toBe(200);
    
    // Database Validation: Verify user exists
    const user = await dbHelpers.getUserByEmail('demo@qa.com');
    expect(user).not.toBeNull();
    expect(user.email).toBe('demo@qa.com');
    
    // Security Check: Verify password is hashed
    const isHashed = await dbHelpers.isPasswordHashed('demo@qa.com');
    expect(isHashed).toBe(true);
    
    console.log('✅ User verified in database with hashed password');
  });
  
  test('Example 2: Verify account creation in database', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // Get user for validation
    const user = await dbHelpers.getUserByEmail('demo@qa.com');
    const initialAccountCount = await dbHelpers.countAccounts();
    
    // API Test: Create account
    const response = await request.post(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency: 'EUR' },
    });
    
    expect(response.status()).toBe(201);
    const { id: accountId } = await response.json();
    
    // Database Validation: Verify account exists
    const account = await dbHelpers.getAccountById(accountId);
    expect(account).not.toBeNull();
    expect(account.currency).toBe('EUR');
    expect(account.balance).toBe('0.00'); // Initial balance should be 0
    expect(account.user_id).toBe(user.id); // Should be linked to correct user
    
    // Verify account count increased by 1
    const newAccountCount = await dbHelpers.countAccounts();
    expect(newAccountCount).toBe(initialAccountCount + 1);
    
    console.log('✅ Account verified in database with correct initial state');
    
    // Cleanup
    await dbCleanup.deleteAccount(accountId);
  });
  
  test('Example 3: Verify deposit creates transaction and updates balance', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // Setup: Create account
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency: 'USD' },
    });
    const { id: accountId } = await createResponse.json();
    
    const initialTransactionCount = await dbHelpers.countTransactions();
    
    // API Test: Make deposit
    const depositResponse = await request.post(`${BASE_URL}/deposits`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        accountId,
        amount: 150.50,
        reference: 'Test deposit for validation',
      },
    });
    
    expect(depositResponse.status()).toBe(200);
    const depositBody = await depositResponse.json();
    expect(depositBody.balance).toBe(150.50);
    
    // Database Validation: Verify account balance
    const account = await dbHelpers.getAccountById(accountId);
    expect(account.balance).toBe('150.50');
    
    // Database Validation: Verify transaction was created
    const transactions = await dbHelpers.getTransactionsByAccount(accountId);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe('deposit');
    expect(transactions[0].amount).toBe('150.50');
    expect(transactions[0].reference).toBe('Test deposit for validation');
    
    // Verify transaction count increased
    const newTransactionCount = await dbHelpers.countTransactions();
    expect(newTransactionCount).toBe(initialTransactionCount + 1);
    
    // Verify balance matches transaction sum
    const balanceCheck = await dbHelpers.verifyAccountBalance(accountId);
    expect(balanceCheck.isValid).toBe(true);
    expect(balanceCheck.difference).toBe(0);
    
    console.log('✅ Deposit verified: transaction created and balance updated correctly');
    
    // Cleanup
    await dbCleanup.deleteAccount(accountId);
  });
  
  test('Example 4: Verify multiple deposits calculate correct balance', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // Setup: Create account
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency: 'EUR' },
    });
    const { id: accountId } = await createResponse.json();
    
    // Make multiple deposits
    const deposits = [
      { amount: 100, reference: 'First deposit' },
      { amount: 50.75, reference: 'Second deposit' },
      { amount: 25.25, reference: 'Third deposit' },
    ];
    
    for (const deposit of deposits) {
      await request.post(`${BASE_URL}/deposits`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          accountId,
          amount: deposit.amount,
          reference: deposit.reference,
        },
      });
    }
    
    const expectedTotal = deposits.reduce((sum, d) => sum + d.amount, 0);
    
    // Database Validation: Verify all transactions exist
    const transactions = await dbHelpers.getTransactionsByAccount(accountId);
    expect(transactions).toHaveLength(3);
    
    // Verify each transaction
    transactions.forEach((tx, index) => {
      expect(tx.type).toBe('deposit');
      expect(parseFloat(tx.amount)).toBe(deposits[index].amount);
      expect(tx.reference).toBe(deposits[index].reference);
    });
    
    // Verify final balance
    const account = await dbHelpers.getAccountById(accountId);
    expect(parseFloat(account.balance)).toBe(expectedTotal);
    
    // Verify balance integrity
    const balanceCheck = await dbHelpers.verifyAccountBalance(accountId);
    expect(balanceCheck.isValid).toBe(true);
    
    console.log('✅ Multiple deposits verified: all transactions recorded and balance is correct');
    
    // Cleanup
    await dbCleanup.deleteAccount(accountId);
  });
  
  test('Example 5: Verify account isolation between users', async ({ request }) => {
    const token = await getAuthToken(request);
    const user = await dbHelpers.getUserByEmail('demo@qa.com');
    
    // Create account for demo user
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency: 'EUR' },
    });
    const { id: accountId } = await createResponse.json();
    
    // Database Validation: Verify account belongs to correct user
    const account = await dbHelpers.getAccountById(accountId);
    expect(account.user_id).toBe(user.id);
    
    // Verify this is the only account for this test
    const userAccounts = await dbHelpers.getAccountsByUserId(user.id);
    const testAccount = userAccounts.find(a => a.id === accountId);
    expect(testAccount).toBeDefined();
    expect(testAccount?.user_id).toBe(user.id);
    
    console.log('✅ Account isolation verified: account belongs to correct user');
    
    // Cleanup
    await dbCleanup.deleteAccount(accountId);
  });
  
  test('Example 6: Verify no negative balances are possible', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // Create account with initial deposit
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency: 'USD' },
    });
    const { id: accountId } = await createResponse.json();
    
    await request.post(`${BASE_URL}/deposits`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { accountId, amount: 50 },
    });
    
    // Database Validation: Verify balance is not negative
    const hasNegative = await dbHelpers.hasNegativeBalance(accountId);
    expect(hasNegative).toBe(false);
    
    const account = await dbHelpers.getAccountById(accountId);
    expect(parseFloat(account.balance)).toBeGreaterThanOrEqual(0);
    
    console.log('✅ Balance constraint verified: no negative balances');
    
    // Cleanup
    await dbCleanup.deleteAccount(accountId);
  });
  
  test('Example 7: Verify transaction timestamps are recent', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // Create account and make deposit
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency: 'EUR' },
    });
    const { id: accountId } = await createResponse.json();
    
    const beforeDeposit = new Date();
    
    await request.post(`${BASE_URL}/deposits`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { accountId, amount: 75 },
    });
    
    const afterDeposit = new Date();
    
    // Database Validation: Verify transaction timestamp
    const transaction = await dbHelpers.getLatestTransaction(accountId);
    expect(transaction).not.toBeNull();
    
    const txTime = new Date(transaction.created_at);
    expect(txTime.getTime()).toBeGreaterThanOrEqual(beforeDeposit.getTime());
    expect(txTime.getTime()).toBeLessThanOrEqual(afterDeposit.getTime());
    
    // Verify timestamp is recent (within last minute)
    const timeDiff = Date.now() - txTime.getTime();
    expect(timeDiff).toBeLessThan(60000); // 60 seconds
    
    console.log('✅ Transaction timestamp verified: created at correct time');
    
    // Cleanup
    await dbCleanup.deleteAccount(accountId);
  });
  
  test('Example 8: Verify account exists before checking transactions', async ({ request }) => {
    const token = await getAuthToken(request);
    
    // Create account
    const createResponse = await request.post(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency: 'EUR' },
    });
    const { id: accountId } = await createResponse.json();
    
    // Database Validation: Verify account exists
    const exists = await dbHelpers.accountExists(accountId);
    expect(exists).toBe(true);
    
    // Make deposit
    await request.post(`${BASE_URL}/deposits`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { accountId, amount: 100 },
    });
    
    // Verify transaction is linked to existing account
    const transaction = await dbHelpers.getLatestTransaction(accountId);
    expect(transaction.account_id).toBe(accountId);
    
    // Verify account still exists
    const stillExists = await dbHelpers.accountExists(accountId);
    expect(stillExists).toBe(true);
    
    console.log('✅ Data relationships verified: transaction linked to valid account');
    
    // Cleanup
    await dbCleanup.deleteAccount(accountId);
  });
});
