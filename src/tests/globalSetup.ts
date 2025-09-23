/**
 * Jest Global Setup
 * Runs once before all tests
 */

export default async (): Promise<void> => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PAYMENT_API_BASE_URL = 'http://localhost:3000/api';

  // Any global setup needed before tests run
  console.log('🚀 Starting Universal Payments test suite...');
};