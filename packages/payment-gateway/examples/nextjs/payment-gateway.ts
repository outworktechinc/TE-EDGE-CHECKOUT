/**
 * Payment Gateway Instance for Next.js
 * Import this in your components
 */

import { PaymentGatewayManager } from '@your-org/payment-gateway';
import { nextJsAdapter } from './payment-adapter';

export const paymentGateway = new PaymentGatewayManager(nextJsAdapter);
