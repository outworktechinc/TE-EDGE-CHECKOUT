/**
 * Next.js Environment Adapter
 * Use this adapter in your Next.js application
 */

import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';

const config: GatewayConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  authorizeNetClientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY,
  authorizeNetApiLoginId: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN_ID,
  braintreeClientTokenUrl: '/api/braintree/token',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || ''
};

export const nextJsAdapter: EnvironmentAdapter = {
  getConfig: (key) => config[key],
  isBrowser: () => typeof window !== 'undefined',
  fetch: (url, options) => fetch(url, options)
};
