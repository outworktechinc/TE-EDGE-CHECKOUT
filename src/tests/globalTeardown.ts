/**
 * Jest Global Teardown
 * Runs once after all tests complete
 */

export default async (): Promise<void> => {
  // Cleanup any global resources
  console.log('✅ Universal Payments test suite completed');
};