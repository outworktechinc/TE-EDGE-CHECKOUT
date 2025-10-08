# Gateway Detection & Dynamic Payment Configuration

This document explains how to use the enhanced gateway detection features.

## Overview

The library now supports automatic gateway detection from your backend API, enabling dynamic payment configuration based on your business rules.

## Features

1. **Automatic Gateway Detection** - Detects active gateway at startup via API call
2. **4 Payment Scenarios** - Handles Stripe session, Stripe redirect, Braintree Edge, Authorize.Net Edge
3. **Stripe Session Management** - Create and manage Stripe Checkout sessions
4. **Redirect Handling** - Automatic redirect to Stripe Checkout when required
5. **Unified API** - Single `getPaymentMethodToken()` method for all scenarios

## API Endpoint Required

Your backend must implement this endpoint:

```
GET {baseUrl}/api/integration/getDefaultSubscriptionType
```

### Response Format

```json
{
  "Status": true,
  "msgCode": "API000",
  "message": "Success",
  "data": {
    "gatewayName": "Stripe",
    "paymentThrough": "Stripe",
    "redirectUrl": {
      "isAvailable": false,
      "url": "https://checkout.stripe.com/..."
    }
  },
  "Token": null
}
```

### Supported Values

- **gatewayName**: `"Stripe"`, `"Braintree"`, `"Authorize.Net"`
- **paymentThrough**: `"Stripe"`, `"Edge Checkout"`
- **redirectUrl.isAvailable**: `true` or `false` (only relevant for Stripe)

## Payment Scenarios

### Scenario A: Stripe Session-Based Checkout

**Configuration:**
```json
{
  "gatewayName": "Stripe",
  "paymentThrough": "Stripe",
  "redirectUrl": { "isAvailable": false }
}
```

**Behavior:**
- Creates a Stripe Checkout Session
- Returns `sessionId` as the payment method token
- User stays on your application (embedded checkout)

**Usage:**
```typescript
const manager = new PaymentGatewayManager(adapter);
await manager.detectGateway();

const result = await manager.getPaymentMethodToken({
  sessionRequest: {
    amount: 1999, // $19.99 in cents
    currency: 'USD',
    successUrl: 'https://yourapp.com/success',
    cancelUrl: 'https://yourapp.com/cancel',
    customerEmail: 'customer@example.com'
  }
});

console.log(result.token); // "cs_test_a1b2c3..."
console.log(result.tokenType); // "sessionId"
```

### Scenario B: Stripe Redirect Checkout

**Configuration:**
```json
{
  "gatewayName": "Stripe",
  "paymentThrough": "Stripe",
  "redirectUrl": {
    "isAvailable": true,
    "url": "https://checkout.stripe.com/pay/..."
  }
}
```

**Behavior:**
- Creates a Stripe Checkout Session
- Automatically redirects user to Stripe's hosted checkout page
- User returns to your app with `session_id` in URL
- Extract `sessionId` from URL params

**Usage:**

**Step 1: Create session and redirect**
```typescript
const manager = new PaymentGatewayManager(adapter);
await manager.detectGateway();

// This will automatically redirect to Stripe
await manager.getPaymentMethodToken({
  sessionRequest: {
    amount: 1999,
    currency: 'USD',
    successUrl: 'https://yourapp.com/success',
    cancelUrl: 'https://yourapp.com/cancel'
  }
});
```

**Step 2: On return, extract session ID**
```typescript
// In your success page component
const manager = new PaymentGatewayManager(adapter);
await manager.detectGateway();

// Check if this is a success redirect
if (manager.isStripeSuccessRedirect()) {
  const sessionId = manager.extractStripeSessionId();
  console.log('Payment completed with session:', sessionId);

  // Or use the unified API
  const result = await manager.getPaymentMethodToken();
  console.log(result.token); // "cs_test_a1b2c3..."
}

// Check if user canceled
if (manager.isStripeCancelRedirect()) {
  console.log('Payment was canceled');
}
```

### Scenario C: Braintree Edge Checkout

**Configuration:**
```json
{
  "gatewayName": "Braintree",
  "paymentThrough": "Edge Checkout",
  "redirectUrl": { "isAvailable": false }
}
```

**Behavior:**
- Shows Edge Checkout card input UI
- Creates Braintree payment method nonce
- Returns `nonce` as the payment method token

**Usage:**
```typescript
const manager = new PaymentGatewayManager(adapter);
await manager.detectGateway();

// Check if Edge Checkout is required
if (manager.requiresEdgeCheckout()) {
  console.log('Show card input form');
}

// After user enters card details
const result = await manager.getPaymentMethodToken({
  card: {
    number: '4111111111111111',
    expMonth: '12',
    expYear: '2025',
    cvc: '123'
  }
});

console.log(result.token); // Braintree nonce
console.log(result.tokenType); // "nonce"
```

### Scenario D: Authorize.Net Edge Checkout

**Configuration:**
```json
{
  "gatewayName": "Authorize.Net",
  "paymentThrough": "Edge Checkout",
  "redirectUrl": { "isAvailable": false }
}
```

**Behavior:**
- Shows Edge Checkout card input UI
- Tokenizes card with Authorize.Net Accept.js
- Returns opaque data token

**Usage:**
```typescript
const manager = new PaymentGatewayManager(adapter);
await manager.detectGateway();

// Check if Edge Checkout is required
if (manager.requiresEdgeCheckout()) {
  console.log('Show card input form');
}

// After user enters card details
const result = await manager.getPaymentMethodToken({
  card: {
    number: '4007000000027',
    expMonth: '12',
    expYear: '2025',
    cvc: '123'
  }
});

console.log(result.token); // Authorize.Net opaque data
console.log(result.tokenType); // "rawCard"
```

## Complete Integration Example

### Next.js Application

**1. Create adapter (lib/payment-adapter.ts)**
```typescript
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';

const config: GatewayConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  authorizeNetClientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY,
  authorizeNetApiLoginId: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN_ID,
  braintreeClientTokenUrl: '/api/braintree/token',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL
};

export const adapter: EnvironmentAdapter = {
  getConfig: (key) => config[key],
  isBrowser: () => typeof window !== 'undefined',
  fetch: (url, options) => fetch(url, options)
};
```

**2. Initialize at app startup (app/layout.tsx or pages/_app.tsx)**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { PaymentGatewayManager } from '@your-org/payment-gateway';
import { adapter } from '@/lib/payment-adapter';

export default function RootLayout({ children }) {
  const [paymentManager, setPaymentManager] = useState<PaymentGatewayManager | null>(null);

  useEffect(() => {
    async function initPaymentGateway() {
      const manager = new PaymentGatewayManager(adapter);

      try {
        const config = await manager.detectGateway();
        console.log('Payment gateway detected:', config.gatewayName);
        console.log('Payment scenario:', config.scenario);

        setPaymentManager(manager);
      } catch (error) {
        console.error('Failed to detect gateway:', error);
      }
    }

    initPaymentGateway();
  }, []);

  return (
    <PaymentContext.Provider value={paymentManager}>
      {children}
    </PaymentContext.Provider>
  );
}
```

**3. Use in payment component (components/PaymentForm.tsx)**
```typescript
'use client';

import { useState } from 'react';
import { usePaymentContext } from '@/lib/payment-context';

export default function PaymentForm() {
  const paymentManager = usePaymentContext();
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const config = paymentManager.getPaymentConfiguration();

      let result;

      if (config?.scenario === 'stripe-session' || config?.scenario === 'stripe-redirect') {
        // Stripe scenarios
        result = await paymentManager.getPaymentMethodToken({
          sessionRequest: {
            amount: 1999, // $19.99
            currency: 'USD',
            successUrl: window.location.origin + '/payment/success',
            cancelUrl: window.location.origin + '/payment/cancel'
          }
        });
      } else {
        // Edge Checkout scenarios (Braintree, Authorize.Net)
        result = await paymentManager.getPaymentMethodToken({
          card: cardDetails
        });
      }

      console.log('Payment token:', result.token);
      console.log('Token type:', result.tokenType);

      // Send token to your backend for processing
      await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: result.token,
          tokenType: result.tokenType,
          gateway: result.gatewayName,
          amount: 1999
        })
      });

      alert('Payment successful!');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Conditionally render based on scenario
  const config = paymentManager?.getPaymentConfiguration();

  return (
    <form onSubmit={handleSubmit}>
      <h2>Payment</h2>

      {config?.scenario && (
        <p>Payment Method: {config.scenario}</p>
      )}

      {/* Only show card input for Edge Checkout */}
      {paymentManager?.requiresEdgeCheckout() && (
        <div>
          <input
            type="text"
            placeholder="Card Number"
            value={cardDetails.number}
            onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
          />
          <input
            type="text"
            placeholder="MM"
            value={cardDetails.expMonth}
            onChange={e => setCardDetails({ ...cardDetails, expMonth: e.target.value })}
          />
          <input
            type="text"
            placeholder="YYYY"
            value={cardDetails.expYear}
            onChange={e => setCardDetails({ ...cardDetails, expYear: e.target.value })}
          />
          <input
            type="text"
            placeholder="CVC"
            value={cardDetails.cvc}
            onChange={e => setCardDetails({ ...cardDetails, cvc: e.target.value })}
          />
        </div>
      )}

      {/* For Stripe, button initiates session creation */}
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
```

**4. Handle Stripe redirect return (app/payment/success/page.tsx)**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { PaymentGatewayManager } from '@your-org/payment-gateway';
import { adapter } from '@/lib/payment-adapter';

export default function PaymentSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function handleReturn() {
      const manager = new PaymentGatewayManager(adapter);
      await manager.detectGateway();

      if (manager.isStripeSuccessRedirect()) {
        const id = manager.extractStripeSessionId();
        setSessionId(id);

        // Optionally verify payment on backend
        await fetch('/api/verify-payment', {
          method: 'POST',
          body: JSON.stringify({ sessionId: id })
        });
      }
    }

    handleReturn();
  }, []);

  return (
    <div>
      <h1>Payment Successful!</h1>
      {sessionId && <p>Session ID: {sessionId}</p>}
    </div>
  );
}
```

## API Reference

### PaymentGatewayManager

#### New Methods

##### `detectGateway(): Promise<PaymentConfiguration>`
Detects active gateway from backend API. Should be called at application startup.

##### `getPaymentConfiguration(): PaymentConfiguration | null`
Returns current payment configuration.

##### `setPaymentConfiguration(response: GatewayDetectionResponse): PaymentConfiguration`
Manually set configuration from API response.

##### `getPaymentMethodToken(input?): Promise<{ token, tokenType, gatewayName }>`
**Main method to get payment token.** Automatically handles all 4 scenarios.

Input parameters (conditional based on scenario):
- `card?: CardInput` - Required for Edge Checkout scenarios
- `sessionRequest?: StripeSessionRequest` - Required for Stripe scenarios

##### `createStripeCheckoutSession(request): Promise<StripeSessionResponse>`
Creates Stripe Checkout Session. Auto-redirects if required.

##### `extractStripeSessionId(url?): string | null`
Extracts session ID from URL after Stripe redirect.

##### `isStripeSuccessRedirect(url?): boolean`
Checks if current URL is a Stripe success redirect.

##### `isStripeCancelRedirect(url?): boolean`
Checks if current URL is a Stripe cancel redirect.

##### `requiresEdgeCheckout(): boolean`
Returns true if Edge Checkout UI is required.

##### `requiresStripeRedirect(): boolean`
Returns true if Stripe redirect flow is active.

### Types

#### PaymentConfiguration
```typescript
interface PaymentConfiguration {
  gatewayName: GatewayName;
  paymentMethod: PaymentMethod;
  requiresRedirect: boolean;
  redirectUrl?: string;
  scenario: 'stripe-session' | 'stripe-redirect' | 'braintree-edge' | 'authorizenet-edge';
  tokenType: 'sessionId' | 'nonce' | 'rawCard';
}
```

#### StripeSessionRequest
```typescript
interface StripeSessionRequest {
  amount: number; // in smallest currency unit (cents for USD)
  currency?: string; // default: 'USD'
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}
```

## Error Handling

```typescript
try {
  await manager.detectGateway();
} catch (error) {
  if (error.code === 'CONFIG_MISSING') {
    console.error('apiBaseUrl not configured');
  } else if (error.code === 'DETECTION_FAILED') {
    console.error('Backend API failed');
  } else if (error.code === 'NOT_SUPPORTED') {
    console.error('Unsupported gateway configuration');
  }
}
```

## Testing

Use test mode for all gateways:

```typescript
const testAdapter: EnvironmentAdapter = {
  getConfig: (key) => {
    const config = {
      stripePublishableKey: 'pk_test_...',
      authorizeNetClientKey: 'test_client_key',
      authorizeNetApiLoginId: 'test_api_login',
      apiBaseUrl: 'http://localhost:3000'
    };
    return config[key];
  },
  isBrowser: () => true,
  fetch: (url, options) => fetch(url, options)
};
```

## Backend Implementation Guide

Your backend needs these endpoints:

### 1. Gateway Detection
```
GET /api/integration/getDefaultSubscriptionType
```

### 2. Stripe Session Creation (for Stripe scenarios)
```
POST /api/payments/stripe/create-session
Body: { amount, currency, successUrl, cancelUrl, customerEmail, metadata }
Response: { sessionId, url? }
```

### 3. Braintree Client Token (for Braintree scenarios)
```
GET /api/braintree/token
Response: { clientToken }
```

### 4. Payment Processing
```
POST /api/process-payment
Body: { token, tokenType, gateway, amount }
```

Handle based on tokenType:
- `sessionId`: Complete Stripe session
- `nonce`: Process Braintree nonce
- `rawCard`: Process Authorize.Net opaque data
