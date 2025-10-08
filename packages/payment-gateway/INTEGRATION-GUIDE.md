# Integration Guide

This guide shows you how to integrate the payment gateway library into your Next.js or Angular application.

## Table of Contents

- [Next.js Integration](#nextjs-integration)
- [Angular Integration](#angular-integration)
- [Backend Setup](#backend-setup)
- [Testing](#testing)

## Next.js Integration

### Step 1: Install the Package

```bash
npm install @your-org/payment-gateway
```

### Step 2: Create Environment Adapter

Create `lib/payment-adapter.ts`:

```typescript
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
```

### Step 3: Initialize Payment Gateway

Create `lib/payment-gateway.ts`:

```typescript
import { PaymentGatewayManager } from '@your-org/payment-gateway';
import { nextJsAdapter } from './payment-adapter';

export const paymentGateway = new PaymentGatewayManager(nextJsAdapter);
```

### Step 4: Add Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_AUTHNET_CLIENT_KEY=xxx
NEXT_PUBLIC_AUTHNET_API_LOGIN_ID=xxx
NEXT_PUBLIC_API_URL=https://your-api.com
```

### Step 5: Use in Components

```typescript
'use client';

import { paymentGateway } from '@/lib/payment-gateway';

export default function CheckoutPage() {
  const handlePayment = async () => {
    const { token } = await paymentGateway.createPaymentToken(
      {
        number: '4111111111111111',
        expMonth: '12',
        expYear: '2025',
        cvc: '123'
      },
      'Stripe'
    );

    // Send token to your backend
    await fetch('/api/process-payment', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  };

  return <button onClick={handlePayment}>Pay Now</button>;
}
```

---

## Angular Integration

### Step 1: Install the Package

```bash
npm install @your-org/payment-gateway
```

### Step 2: Create Environment Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  stripePublishableKey: 'pk_test_xxx',
  authorizeNetClientKey: 'xxx',
  authorizeNetApiLoginId: 'xxx',
  apiBaseUrl: 'https://your-api.com'
};
```

### Step 3: Create Payment Adapter Service

Create `src/app/services/payment-adapter.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
    const method = (options?.method || 'GET').toUpperCase();
    const headers = new HttpHeaders(options?.headers as any);

    let body: any = undefined;
    if (options?.body) {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    const response = await firstValueFrom(
      this.http.request(method, url, {
        body,
        headers,
        observe: 'response',
        responseType: 'json'
      })
    );

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      statusText: response.statusText
    });
  }
}
```

### Step 4: Create Payment Gateway Service

Create `src/app/services/payment-gateway.service.ts`:

```typescript
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
}
```

### Step 5: Use in Components

```typescript
import { Component } from '@angular/core';
import { PaymentGatewayService } from './services/payment-gateway.service';

@Component({
  selector: 'app-checkout',
  template: `<button (click)="handlePayment()">Pay Now</button>`
})
export class CheckoutComponent {
  constructor(private paymentGateway: PaymentGatewayService) {}

  async handlePayment() {
    const { token } = await this.paymentGateway.createToken(
      {
        number: '4111111111111111',
        expMonth: '12',
        expYear: '2025',
        cvc: '123'
      },
      'Stripe'
    );

    // Send token to your backend
  }
}
```

### Step 6: Import HttpClientModule

In `app.module.ts`:

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    HttpClientModule,
    // ... other imports
  ]
})
export class AppModule { }
```

---

## Backend Setup

### Stripe Backend (Required for Edge Checkout)

```typescript
// POST /api/payments/stripe/create-payment-method
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { cardNumber, expMonth, expYear, cvc } = await req.json();

  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: parseInt(expMonth),
        exp_year: parseInt(expYear),
        cvc: cvc
      }
    });

    return Response.json({
      paymentMethodId: paymentMethod.id,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### Braintree Backend

```typescript
// GET /api/braintree/token
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID!,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY!
});

export async function GET() {
  const response = await gateway.clientToken.generate({});
  return Response.json({ clientToken: response.clientToken });
}
```

---

## Testing

### Test Card Numbers

**Stripe:**
- Success: `4242424242424242`
- Declined: `4000000000000002`

**Braintree:**
- Success: `4111111111111111`
- Declined: `4000111111111115`

**Authorize.Net:**
- Success: `4007000000027`
- Declined: `4222222222222`

### Test Data

- Expiry: Any future date (e.g., `12/2025`)
- CVC: Any 3-4 digits (e.g., `123`)

---

## Troubleshooting

### "SDK not loaded" Error

Make sure you're calling the payment methods in a browser environment, not during SSR.

### CORS Errors

Ensure your backend API endpoints have proper CORS headers configured.

### Environment Variables Not Working

- **Next.js**: Prefix with `NEXT_PUBLIC_` and restart dev server
- **Angular**: Rebuild the app after changing `environment.ts`

---

## Support

For more help, see the [main README](./README.md) or open an issue on GitHub.
