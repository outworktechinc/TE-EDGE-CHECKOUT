# Payment Gateway Library

A framework-agnostic TypeScript library for integrating payment gateways (Stripe, Braintree, Authorize.Net) with Next.js, Angular, React, or any JavaScript framework.

## Features

- ✅ **Framework Agnostic** - Works with Next.js, Angular, React, Vue, or vanilla JavaScript
- ✅ **Multiple Gateways** - Stripe, Braintree, and Authorize.Net support
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Lightweight** - No heavy dependencies
- ✅ **Secure** - Client-side tokenization, server-side processing
- ✅ **Card Validation** - Luhn algorithm, expiry validation, card brand detection
- ✅ **Address Validation** - US/Canada/GB postal code and state validation
- ✅ **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Event System** - Payment lifecycle hooks and monitoring
- ✅ **Transaction Logging** - Sanitized logs with PII protection
- ✅ **3D Secure** - SCA (Strong Customer Authentication) support
- ✅ **Currency Utils** - Formatting and conversion utilities
- ✅ **Card Icons** - Embedded SVG icons for all major card brands
- ✅ **Test Utilities** - Pre-configured test cards for all gateways

## Installation

```bash
npm install @your-org/payment-gateway
```

## Quick Start

### 1. Create an Environment Adapter

The library requires an environment adapter to access configuration and make HTTP requests.

#### Next.js Adapter Example

```typescript
// lib/payment-adapter.ts
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';

const config: GatewayConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  authorizeNetClientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY,
  authorizeNetApiLoginId: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN_ID,
  braintreeClientTokenUrl: '/api/braintree/token',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL
};

export const nextJsAdapter: EnvironmentAdapter = {
  getConfig: (key) => config[key],
  isBrowser: () => typeof window !== 'undefined',
  fetch: (url, options) => fetch(url, options)
};
```

#### Angular Adapter Example

```typescript
// services/payment-adapter.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentAdapterService implements EnvironmentAdapter {
  private config: GatewayConfig = {
    stripePublishableKey: environment.stripePublishableKey,
    authorizeNetClientKey: environment.authorizeNetClientKey,
    authorizeNetApiLoginId: environment.authorizeNetApiLoginId,
    braintreeClientTokenUrl: '/api/braintree/token',
    apiBaseUrl: environment.apiBaseUrl
  };

  constructor(private http: HttpClient) {}

  getConfig(key: keyof GatewayConfig): string | undefined {
    return this.config[key];
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    // Convert Angular HttpClient to fetch-like response
    const response = await this.http.request(
      options?.method || 'GET',
      url,
      {
        body: options?.body,
        headers: options?.headers as any,
        observe: 'response',
        responseType: 'json'
      }
    ).toPromise();

    return new Response(JSON.stringify(response?.body), {
      status: response?.status,
      headers: new Headers(response?.headers as any)
    });
  }
}
```

### 2. Initialize the Payment Gateway Manager

#### Next.js Example

```typescript
// lib/payment-gateway.ts
import { PaymentGatewayManager } from '@your-org/payment-gateway';
import { nextJsAdapter } from './payment-adapter';

export const paymentGateway = new PaymentGatewayManager(nextJsAdapter);
```

#### Angular Example

```typescript
// services/payment-gateway.service.ts
import { Injectable } from '@angular/core';
import { PaymentGatewayManager } from '@your-org/payment-gateway';
import { PaymentAdapterService } from './payment-adapter.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentGatewayService {
  private manager: PaymentGatewayManager;

  constructor(private adapter: PaymentAdapterService) {
    this.manager = new PaymentGatewayManager(adapter);
  }

  async createToken(cardDetails: any, gateway: string) {
    return this.manager.createPaymentToken(cardDetails, gateway as any);
  }

  setGateway(gateway: string) {
    this.manager.setActiveGateway(gateway as any);
  }

  async clearContext() {
    return this.manager.clearPaymentContext();
  }
}
```

### 3. Use in Your Application

#### Next.js Component

```typescript
'use client';

import { useState } from 'react';
import { paymentGateway } from '@/lib/payment-gateway';

export default function PaymentForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { token, gatewayName } = await paymentGateway.createPaymentToken(
        {
          number: '4111111111111111',
          expMonth: '12',
          expYear: '2025',
          cvc: '123'
        },
        'Stripe'
      );

      console.log('Payment token:', token);
      console.log('Gateway:', gatewayName);

      // Send token to your backend
      await fetch('/api/process-payment', {
        method: 'POST',
        body: JSON.stringify({ token, gateway: gatewayName })
      });
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        Pay Now
      </button>
    </form>
  );
}
```

#### Angular Component

```typescript
// components/payment-form.component.ts
import { Component } from '@angular/core';
import { PaymentGatewayService } from '../services/payment-gateway.service';

@Component({
  selector: 'app-payment-form',
  template: `
    <form (ngSubmit)="handleSubmit()">
      <button type="submit" [disabled]="loading">Pay Now</button>
    </form>
  `
})
export class PaymentFormComponent {
  loading = false;

  constructor(private paymentGateway: PaymentGatewayService) {}

  async handleSubmit() {
    this.loading = true;

    try {
      const { token, gatewayName } = await this.paymentGateway.createToken(
        {
          number: '4111111111111111',
          expMonth: '12',
          expYear: '2025',
          cvc: '123'
        },
        'Stripe'
      );

      console.log('Payment token:', token);
      console.log('Gateway:', gatewayName);

      // Send token to your backend
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      this.loading = false;
    }
  }
}
```

## API Reference

### `PaymentGatewayManager`

#### Constructor

```typescript
new PaymentGatewayManager(adapter: EnvironmentAdapter)
```

#### Properties

##### `events: PaymentEventEmitter`
Event emitter for payment lifecycle events.

##### `validateCards: boolean`
Enable/disable card validation (default: `true`).

##### `enableRetry: boolean`
Enable/disable automatic retry logic (default: `true`).

##### `retryOptions: RetryOptions`
Configure retry behavior.

#### Methods

##### `setActiveGateway(gatewayName: GatewayName): void`
Set the active payment gateway.

##### `getActiveGateway(): GatewayName | null`
Get the current active gateway.

##### `createPaymentToken(card: CardInput, gatewayName: GatewayName): Promise<TokenResult>`
Create a payment token from card details.

##### `isGatewayReady(gatewayName: GatewayName): boolean`
Check if a gateway is initialized and ready.

##### `clearPaymentContext(): Promise<void>`
Clear all payment context (call on logout).

##### `setLogLevel(level: LogLevel): void`
Set the logging level (`debug`, `info`, `warn`, `error`).

##### `getLogs(): string`
Export transaction logs as JSON.

##### `getStats()`
Get transaction statistics by level and gateway.

## Advanced Features

### Card Validation

```typescript
import { validateCard, detectCardBrand } from '@your-org/payment-gateway';

// Validate card
const validation = validateCard({
  number: '4111111111111111',
  expMonth: '12',
  expYear: '2025',
  cvc: '123'
});

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Detect card brand
const brand = detectCardBrand('4111111111111111'); // 'visa'
```

### Address Validation

```typescript
import { validateBillingAddress } from '@your-org/payment-gateway';

const validation = validateBillingAddress({
  firstName: 'John',
  lastName: 'Doe',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'US'
});

if (!validation.isValid) {
  console.error('Address errors:', validation.errors);
}
```

### Event System

```typescript
import { PaymentEvent } from '@your-org/payment-gateway';

// Listen to all events
paymentGateway.events.onAny((event, data) => {
  console.log(`Event: ${event}`, data);
});

// Listen to specific events
paymentGateway.events.on(PaymentEvent.TOKENIZATION_SUCCESS, (data) => {
  console.log('Token created:', data.token);
});

// One-time listener
const unsubscribe = paymentGateway.events.once(PaymentEvent.GATEWAY_INITIALIZED, (data) => {
  console.log('Gateway ready:', data.gateway);
});
```

### Transaction Logging

```typescript
import { LogLevel } from '@your-org/payment-gateway';

// Set log level
paymentGateway.setLogLevel(LogLevel.DEBUG);

// Get logs
const logs = paymentGateway.getLogs();
console.log(logs);

// Get stats
const stats = paymentGateway.getStats();
console.log('Total transactions:', stats.total);
console.log('By gateway:', stats.byGateway);
```

### 3D Secure Support

```typescript
import { handleStripe3DS, is3DSRequired } from '@your-org/payment-gateway';

// Check if 3DS required
if (is3DSRequired(100, 'GB')) {
  console.log('SCA required for this transaction');
}

// Handle Stripe 3DS
const result = await handleStripe3DS(
  paymentIntentClientSecret,
  stripe,
  {
    onChallenge: () => console.log('3DS challenge presented'),
    onSuccess: () => console.log('3DS authenticated')
  }
);
```

### Currency Utilities

```typescript
import { formatCurrency, toSmallestUnit, fromSmallestUnit } from '@your-org/payment-gateway';

// Format currency
const formatted = formatCurrency(1234.56, { currency: 'USD', locale: 'en-US' });
// "$1,234.56"

// Convert to smallest unit (cents)
const cents = toSmallestUnit(12.99, 'USD'); // 1299

// Convert from smallest unit
const dollars = fromSmallestUnit(1299, 'USD'); // 12.99
```

### Card Icons

```typescript
import { getCardIcon, CARD_ICONS } from '@your-org/payment-gateway';

// Get icon for detected brand
const brand = detectCardBrand('4111111111111111');
const iconUrl = getCardIcon(brand);

// Use in HTML
<img src={iconUrl} alt={brand} />

// Preload all icons
preloadCardIcons();
```

### Test Utilities

```typescript
import { TEST_CARDS, getTestCard, createMockAdapter } from '@your-org/payment-gateway';

// Get test card
const testCard = getTestCard('Stripe', 'success');
// { number: '4242424242424242', expMonth: '12', expYear: '2030', cvc: '123' }

// Create mock adapter for testing
const mockAdapter = createMockAdapter({
  stripePublishableKey: 'pk_test_xxx'
});

const manager = new PaymentGatewayManager(mockAdapter);
```

### Retry Configuration

```typescript
// Configure retry behavior
paymentGateway.enableRetry = true;
paymentGateway.retryOptions = {
  maxAttempts: 5,
  delayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 30000
};

// Disable validation for specific use case
paymentGateway.validateCards = false;
```

## Environment Variables

### Next.js (.env.local)

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Authorize.Net
NEXT_PUBLIC_AUTHNET_CLIENT_KEY=xxx
NEXT_PUBLIC_AUTHNET_API_LOGIN_ID=xxx

# API Base URL
NEXT_PUBLIC_API_URL=https://your-api.com
```

### Angular (environment.ts)

```typescript
export const environment = {
  production: false,
  stripePublishableKey: 'pk_test_xxx',
  authorizeNetClientKey: 'xxx',
  authorizeNetApiLoginId: 'xxx',
  apiBaseUrl: 'https://your-api.com'
};
```

## Backend Requirements

### Stripe
For Edge Checkout, you need a backend endpoint:

```typescript
// POST /api/payments/stripe/create-payment-method
// Returns: { paymentMethodId: string }
```

### Braintree
You need a backend endpoint to generate client tokens:

```typescript
// GET /api/braintree/token
// Returns: { clientToken: string }
```

### Authorize.Net
No backend endpoint required for tokenization (uses Accept.js).

## Security Notes

- ✅ Never store raw card data
- ✅ Use HTTPS only in production
- ✅ Payment tokens are single-use and short-lived
- ✅ Never log sensitive card information
- ✅ Keep private keys server-side only

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
