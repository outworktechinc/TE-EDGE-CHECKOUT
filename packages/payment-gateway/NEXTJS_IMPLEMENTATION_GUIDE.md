# Next.js Implementation Guide - Payment Gateway Library

## Complete Step-by-Step Guide for Next.js

This guide provides baby steps to integrate the payment gateway library into your Next.js application. Follow each step carefully to ensure nothing is missed.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Create Environment Adapter](#create-environment-adapter)
5. [Create Payment Context](#create-payment-context)
6. [Initialize at App Startup](#initialize-at-app-startup)
7. [Create Payment Hook](#create-payment-hook)
8. [Create Card Input Component (Edge Checkout)](#create-card-input-component)
9. [Create Payment Form Component](#create-payment-form-component)
10. [Create Success Page (Stripe Redirect)](#create-success-page)
11. [Create Cancel Page (Stripe Redirect)](#create-cancel-page)
12. [Backend API Implementation](#backend-api-implementation)
13. [Testing](#testing)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Before you start:**

- [ ] Next.js 13+ installed (App Router or Pages Router)
- [ ] Node.js 18+ installed
- [ ] TypeScript configured
- [ ] Backend API ready with gateway detection endpoint
- [ ] Payment gateway credentials (Stripe/Braintree/Authorize.Net)

---

## Installation

### Step 1: Install the Library

```bash
cd your-nextjs-project
npm install ../payment-gateway-library
```

**Or if published to NPM:**
```bash
npm install @your-org/payment-gateway
```

### Step 2: Verify Installation

```bash
npm list @your-org/payment-gateway
```

You should see the package listed.

---

## Environment Configuration

### Step 3: Create Environment File

Create `.env.local` in your project root:

```bash
# .env.local

# API Base URL (Required)
NEXT_PUBLIC_API_URL=https://mingle-stg-api.aqsatel.com

# Stripe Configuration (if using Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefg

# Braintree Configuration (if using Braintree)
NEXT_PUBLIC_BRAINTREE_TOKEN_URL=/api/braintree/token

# Authorize.Net Configuration (if using Authorize.Net)
NEXT_PUBLIC_AUTHNET_CLIENT_KEY=your_client_key_here
NEXT_PUBLIC_AUTHNET_API_LOGIN_ID=your_api_login_id_here
```

### Step 4: Add to .gitignore

Make sure `.env.local` is in your `.gitignore`:

```bash
# .gitignore
.env.local
.env*.local
```

---

## Create Environment Adapter

### Step 5: Create Adapter File

Create `lib/payment-adapter.ts`:

```typescript
// lib/payment-adapter.ts
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';

/**
 * Gateway configuration from environment variables
 */
const config: GatewayConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  authorizeNetClientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY,
  authorizeNetApiLoginId: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN_ID,
  braintreeClientTokenUrl: process.env.NEXT_PUBLIC_BRAINTREE_TOKEN_URL,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL
};

/**
 * Next.js Environment Adapter
 * Implements the EnvironmentAdapter interface for Next.js
 */
export const nextJsAdapter: EnvironmentAdapter = {
  /**
   * Get configuration value by key
   */
  getConfig: (key: keyof GatewayConfig) => {
    return config[key];
  },

  /**
   * Check if running in browser
   */
  isBrowser: () => {
    return typeof window !== 'undefined';
  },

  /**
   * Make HTTP request using fetch
   */
  fetch: (url: string, options?: RequestInit) => {
    return fetch(url, options);
  }
};
```

### Step 6: Verify Adapter

Add a test file `lib/payment-adapter.test.ts`:

```typescript
// lib/payment-adapter.test.ts
import { nextJsAdapter } from './payment-adapter';

console.log('Testing adapter...');
console.log('API Base URL:', nextJsAdapter.getConfig('apiBaseUrl'));
console.log('Is Browser:', nextJsAdapter.isBrowser());
console.log('Adapter ready! ✅');
```

Run test:
```bash
npx ts-node lib/payment-adapter.test.ts
```

---

## Create Payment Context

### Step 7: Create Context File

Create `lib/payment-context.tsx`:

```typescript
// lib/payment-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PaymentGatewayManager, PaymentConfiguration } from '@your-org/payment-gateway';
import { nextJsAdapter } from './payment-adapter';

interface PaymentContextType {
  manager: PaymentGatewayManager | null;
  config: PaymentConfiguration | null;
  isLoading: boolean;
  error: Error | null;
}

const PaymentContext = createContext<PaymentContextType>({
  manager: null,
  config: null,
  isLoading: true,
  error: null
});

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<PaymentGatewayManager | null>(null);
  const [config, setConfig] = useState<PaymentConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initializePaymentGateway() {
      try {
        console.log('Initializing Payment Gateway...');

        // Create manager instance
        const paymentManager = new PaymentGatewayManager(nextJsAdapter);

        // Detect active gateway from backend
        const paymentConfig = await paymentManager.detectGateway();

        console.log('✅ Payment Gateway Initialized');
        console.log('Gateway:', paymentConfig.gatewayName);
        console.log('Method:', paymentConfig.paymentMethod);
        console.log('Scenario:', paymentConfig.scenario);

        setManager(paymentManager);
        setConfig(paymentConfig);
      } catch (err) {
        console.error('❌ Payment Gateway Initialization Failed:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    initializePaymentGateway();
  }, []);

  return (
    <PaymentContext.Provider value={{ manager, config, isLoading, error }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
}
```

---

## Initialize at App Startup

### Step 8a: App Router Setup (Next.js 13+)

Edit `app/layout.tsx`:

```typescript
// app/layout.tsx
import { PaymentProvider } from '@/lib/payment-context';
import './globals.css';

export const metadata = {
  title: 'Your App',
  description: 'Your app description',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PaymentProvider>
          {children}
        </PaymentProvider>
      </body>
    </html>
  );
}
```

### Step 8b: Pages Router Setup (Next.js 12)

Edit `pages/_app.tsx`:

```typescript
// pages/_app.tsx
import { PaymentProvider } from '@/lib/payment-context';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PaymentProvider>
      <Component {...pageProps} />
    </PaymentProvider>
  );
}
```

---

## Create Payment Hook

### Step 9: Create Custom Hook

Create `hooks/usePaymentGateway.ts`:

```typescript
// hooks/usePaymentGateway.ts
'use client';

import { useState } from 'react';
import { usePayment } from '@/lib/payment-context';
import { CardInput, StripeSessionRequest } from '@your-org/payment-gateway';

export function usePaymentGateway() {
  const { manager, config, isLoading, error } = usePayment();
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  /**
   * Process payment based on current scenario
   */
  const processPayment = async (input: {
    card?: CardInput;
    amount?: number;
    sessionRequest?: StripeSessionRequest;
  }) => {
    if (!manager) {
      throw new Error('Payment manager not initialized');
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      const result = await manager.getPaymentMethodToken(input);

      console.log('Payment Token:', result.token);
      console.log('Token Type:', result.tokenType);
      console.log('Gateway:', result.gatewayName);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setPaymentError(errorMessage);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Check if Edge Checkout UI is needed
   */
  const needsCardInput = () => {
    return manager?.requiresEdgeCheckout() ?? false;
  };

  /**
   * Check if Stripe redirect flow
   */
  const isStripeRedirect = () => {
    return manager?.requiresStripeRedirect() ?? false;
  };

  return {
    manager,
    config,
    isLoading,
    error,
    processing,
    paymentError,
    processPayment,
    needsCardInput,
    isStripeRedirect
  };
}
```

---

## Create Card Input Component

### Step 10: Create Card Input Component

Create `components/CardInput.tsx`:

```typescript
// components/CardInput.tsx
'use client';

import { useState, ChangeEvent } from 'react';
import { CardInput as CardInputType, validateCard, detectCardBrand, getCardIcon } from '@your-org/payment-gateway';
import styles from './CardInput.module.css';

interface CardInputProps {
  onCardChange: (card: CardInputType) => void;
  disabled?: boolean;
}

export default function CardInput({ onCardChange, disabled }: CardInputProps) {
  const [card, setCard] = useState<CardInputType>({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [cardBrand, setCardBrand] = useState<string>('unknown');

  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    const brand = detectCardBrand(value);
    setCardBrand(brand);

    const newCard = { ...card, number: value };
    setCard(newCard);
    onCardChange(newCard);
    validateCardInput(newCard);
  };

  const handleExpMonthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    const newCard = { ...card, expMonth: value };
    setCard(newCard);
    onCardChange(newCard);
    validateCardInput(newCard);
  };

  const handleExpYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    const newCard = { ...card, expYear: value };
    setCard(newCard);
    onCardChange(newCard);
    validateCardInput(newCard);
  };

  const handleCvcChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    const newCard = { ...card, cvc: value };
    setCard(newCard);
    onCardChange(newCard);
    validateCardInput(newCard);
  };

  const validateCardInput = (cardToValidate: CardInputType) => {
    const validation = validateCard(cardToValidate);
    setErrors(validation.isValid ? [] : validation.errors);
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <div className={styles.cardInputContainer}>
      <div className={styles.cardNumberField}>
        <label htmlFor="cardNumber">Card Number</label>
        <div className={styles.cardNumberInput}>
          <input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(card.number)}
            onChange={handleCardNumberChange}
            disabled={disabled}
            maxLength={19}
          />
          {cardBrand !== 'unknown' && (
            <img
              src={getCardIcon(cardBrand as any)}
              alt={cardBrand}
              className={styles.cardIcon}
            />
          )}
        </div>
      </div>

      <div className={styles.cardDetailsRow}>
        <div className={styles.expiryField}>
          <label htmlFor="expMonth">Expiry</label>
          <div className={styles.expiryInputs}>
            <input
              id="expMonth"
              type="text"
              placeholder="MM"
              value={card.expMonth}
              onChange={handleExpMonthChange}
              disabled={disabled}
              maxLength={2}
            />
            <span className={styles.expirySeparator}>/</span>
            <input
              id="expYear"
              type="text"
              placeholder="YYYY"
              value={card.expYear}
              onChange={handleExpYearChange}
              disabled={disabled}
              maxLength={4}
            />
          </div>
        </div>

        <div className={styles.cvcField}>
          <label htmlFor="cvc">CVC</label>
          <input
            id="cvc"
            type="text"
            placeholder="123"
            value={card.cvc}
            onChange={handleCvcChange}
            disabled={disabled}
            maxLength={4}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, index) => (
            <p key={index} className={styles.error}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 11: Create CSS for Card Input

Create `components/CardInput.module.css`:

```css
/* components/CardInput.module.css */
.cardInputContainer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.cardNumberField label,
.expiryField label,
.cvcField label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.cardNumberInput {
  position: relative;
  display: flex;
  align-items: center;
}

.cardNumberInput input {
  flex: 1;
  padding: 12px 45px 12px 12px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
}

.cardNumberInput input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.cardIcon {
  position: absolute;
  right: 12px;
  width: 40px;
  height: 26px;
  object-fit: contain;
}

.cardDetailsRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.expiryInputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expiryInputs input {
  width: 60px;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  text-align: center;
}

.expirySeparator {
  font-size: 18px;
  color: #6b7280;
  font-weight: 500;
}

.cvcField input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  text-align: center;
}

.expiryInputs input:focus,
.cvcField input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.errors {
  margin-top: 8px;
}

.error {
  color: #ef4444;
  font-size: 14px;
  margin: 4px 0;
}
```

---

## Create Payment Form Component

### Step 12: Create Payment Form

Create `components/PaymentForm.tsx`:

```typescript
// components/PaymentForm.tsx
'use client';

import { useState } from 'react';
import { usePaymentGateway } from '@/hooks/usePaymentGateway';
import { CardInput as CardInputType } from '@your-org/payment-gateway';
import CardInput from './CardInput';
import styles from './PaymentForm.module.css';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (token: string, tokenType: string) => void;
  onError: (error: string) => void;
}

export default function PaymentForm({
  amount,
  currency = 'USD',
  onSuccess,
  onError
}: PaymentFormProps) {
  const {
    config,
    isLoading,
    processing,
    processPayment,
    needsCardInput,
    isStripeRedirect
  } = usePaymentGateway();

  const [card, setCard] = useState<CardInputType>({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>Initializing payment gateway...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={styles.error}>
        <p>Payment gateway not configured</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let result;

      if (config.scenario === 'stripe-session' || config.scenario === 'stripe-redirect') {
        // Stripe scenarios
        result = await processPayment({
          sessionRequest: {
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            successUrl: window.location.origin + '/payment/success',
            cancelUrl: window.location.origin + '/payment/cancel',
            customerEmail: undefined // Optional
          }
        });
      } else {
        // Edge Checkout scenarios (Braintree, Authorize.Net)
        result = await processPayment({ card });
      }

      onSuccess(result.token, result.tokenType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      onError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <h2 className={styles.title}>Payment Details</h2>

      <div className={styles.info}>
        <p><strong>Amount:</strong> ${amount.toFixed(2)} {currency}</p>
        <p><strong>Gateway:</strong> {config.gatewayName}</p>
        <p><strong>Method:</strong> {config.paymentMethod}</p>
      </div>

      {needsCardInput() && (
        <div className={styles.cardSection}>
          <CardInput onCardChange={setCard} disabled={processing} />
        </div>
      )}

      {isStripeRedirect() && (
        <div className={styles.notice}>
          <p>You will be redirected to Stripe to complete your payment.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={processing}
        className={styles.submitButton}
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
```

### Step 13: Create CSS for Payment Form

Create `components/PaymentForm.module.css`:

```css
/* components/PaymentForm.module.css */
.paymentForm {
  max-width: 500px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.info {
  background: #f3f4f6;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info p {
  margin: 8px 0;
  font-size: 14px;
  color: #4b5563;
}

.info strong {
  color: #111827;
}

.cardSection {
  margin-bottom: 20px;
}

.notice {
  background: #dbeafe;
  border: 1px solid #3b82f6;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.notice p {
  margin: 0;
  font-size: 14px;
  color: #1e40af;
}

.submitButton {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.submitButton:hover:not(:disabled) {
  background: #2563eb;
}

.submitButton:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
}

.error {
  color: #ef4444;
}
```

---

## Create Success Page

### Step 14: Create Success Page (App Router)

Create `app/payment/success/page.tsx`:

```typescript
// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePayment } from '@/lib/payment-context';
import styles from './success.module.css';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { manager } = usePayment();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handlePaymentSuccess() {
      if (!manager) {
        console.log('Waiting for payment manager...');
        return;
      }

      try {
        // Check if this is a Stripe redirect success
        if (manager.isStripeSuccessRedirect()) {
          const id = manager.extractStripeSessionId();
          setSessionId(id);

          if (id) {
            // Verify payment with backend
            const response = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: id })
            });

            if (response.ok) {
              setVerified(true);
            } else {
              setError('Payment verification failed');
            }
          } else {
            setError('Session ID not found');
          }
        } else {
          // Direct success (non-redirect flow)
          setVerified(true);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment');
      } finally {
        setVerifying(false);
      }
    }

    handlePaymentSuccess();
  }, [manager]);

  if (verifying) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.spinner}></div>
          <h1>Verifying Payment...</h1>
          <p>Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>❌</div>
          <h1>Verification Failed</h1>
          <p>{error}</p>
          <button onClick={() => router.push('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successIcon}>✅</div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your payment.</p>
        {sessionId && (
          <p className={styles.sessionId}>
            Session ID: {sessionId.substring(0, 20)}...
          </p>
        )}
        <button onClick={() => router.push('/')}>Return Home</button>
      </div>
    </div>
  );
}
```

Create `app/payment/success/success.module.css`:

```css
/* app/payment/success/success.module.css */
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f3f4f6;
}

.card {
  background: white;
  padding: 48px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
}

.successIcon,
.errorIcon {
  font-size: 64px;
  margin-bottom: 20px;
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.card p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
}

.sessionId {
  font-size: 12px;
  font-family: monospace;
  color: #9ca3af;
  word-break: break-all;
}

.card button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.card button:hover {
  background: #2563eb;
}
```

---

## Create Cancel Page

### Step 15: Create Cancel Page

Create `app/payment/cancel/page.tsx`:

```typescript
// app/payment/cancel/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import styles from './cancel.module.css';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cancelIcon}>⚠️</div>
        <h1>Payment Canceled</h1>
        <p>Your payment was canceled. No charges were made.</p>
        <div className={styles.actions}>
          <button onClick={() => router.push('/checkout')}>
            Try Again
          </button>
          <button onClick={() => router.push('/')} className={styles.secondary}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
```

Create `app/payment/cancel/cancel.module.css`:

```css
/* app/payment/cancel/cancel.module.css */
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f3f4f6;
}

.card {
  background: white;
  padding: 48px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
}

.cancelIcon {
  font-size: 64px;
  margin-bottom: 20px;
}

.card h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.card p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.actions button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.actions button:hover {
  background: #2563eb;
}

.secondary {
  background: #6b7280 !important;
}

.secondary:hover {
  background: #4b5563 !important;
}
```

---

## Backend API Implementation

### Step 16: Create Backend Verification Endpoint

Create `app/api/payments/verify/route.ts`:

```typescript
// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // TODO: Verify payment with Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.retrieve(sessionId);

    // For now, return success
    return NextResponse.json({
      success: true,
      sessionId,
      status: 'verified'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
```

### Step 17: Create Example Checkout Page

Create `app/checkout/page.tsx`:

```typescript
// app/checkout/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentForm from '@/components/PaymentForm';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handlePaymentSuccess = async (token: string, tokenType: string) => {
    console.log('✅ Payment Token Received');
    console.log('Token:', token);
    console.log('Type:', tokenType);

    // Send to backend for processing
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          tokenType,
          amount: 1999 // $19.99
        })
      });

      if (response.ok) {
        setPaymentStatus('success');
        setTimeout(() => {
          router.push('/payment/success');
        }, 1500);
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      handlePaymentError('Failed to process payment');
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment Error:', error);
    setPaymentStatus('error');
    setErrorMessage(error);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Checkout</h1>

        {paymentStatus === 'success' && (
          <div className={styles.success}>
            Payment successful! Redirecting...
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className={styles.error}>
            {errorMessage}
          </div>
        )}

        <PaymentForm
          amount={19.99}
          currency="USD"
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );
}
```

---

## Testing

### Step 18: Test Configuration

Create a test page `app/test-payment/page.tsx`:

```typescript
// app/test-payment/page.tsx
'use client';

import { usePayment } from '@/lib/payment-context';

export default function TestPaymentPage() {
  const { manager, config, isLoading, error } = usePayment();

  if (isLoading) {
    return <div>Loading payment configuration...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>Payment Configuration Error</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Payment Configuration Test</h1>

      <h2>✅ Payment Manager Initialized</h2>
      <p>Manager: {manager ? 'Ready' : 'Not Ready'}</p>

      <h2>Configuration:</h2>
      <pre>{JSON.stringify(config, null, 2)}</pre>

      <h2>Feature Checks:</h2>
      <ul>
        <li>Requires Edge Checkout: {manager?.requiresEdgeCheckout() ? 'Yes' : 'No'}</li>
        <li>Requires Stripe Redirect: {manager?.requiresStripeRedirect() ? 'Yes' : 'No'}</li>
      </ul>
    </div>
  );
}
```

### Step 19: Run Development Server

```bash
npm run dev
```

Visit:
- http://localhost:3000/test-payment - Test configuration
- http://localhost:3000/checkout - Test payment flow

### Step 20: Test Each Scenario

**Test Stripe Session:**
1. Configure backend to return Stripe scenario
2. Visit checkout page
3. Click "Pay Now"
4. Verify session created

**Test Braintree Edge:**
1. Configure backend to return Braintree scenario
2. Visit checkout page
3. Enter card details
4. Click "Pay Now"
5. Verify nonce generated

**Test Authorize.Net Edge:**
1. Configure backend to return Authorize.Net scenario
2. Visit checkout page
3. Enter card details
4. Click "Pay Now"
5. Verify token generated

---

## Troubleshooting

### Issue: "Payment manager not initialized"

**Solution:**
```typescript
// Check that PaymentProvider is in layout.tsx
// Check console for initialization errors
// Verify API_URL is set in .env.local
```

### Issue: "Gateway detection failed"

**Solution:**
```bash
# Check API endpoint is reachable
curl https://your-api.com/api/integration/getDefaultSubscriptionType

# Check CORS is enabled on backend
# Check API returns correct format
```

### Issue: "Stripe publishable key missing"

**Solution:**
```bash
# Add to .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Restart dev server
npm run dev
```

### Issue: Card validation errors

**Solution:**
```typescript
// Use test cards
const testCards = {
  visa: '4242424242424242',
  mastercard: '5555555555554444',
  amex: '378282246310005'
};
```

---

## Checklist

Before going to production, verify:

- [ ] Environment variables configured
- [ ] Payment adapter created
- [ ] Payment context added to layout
- [ ] Gateway detection working
- [ ] All 4 scenarios tested
- [ ] Success/cancel pages working
- [ ] Backend verification endpoint ready
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Production API keys added
- [ ] HTTPS enabled
- [ ] CORS configured on backend

---

## Next Steps

1. **Implement Backend Endpoints**
   - Gateway detection API
   - Stripe session creation
   - Payment verification
   - Webhook handlers

2. **Add Error Tracking**
   - Integrate Sentry or similar
   - Log payment errors
   - Monitor gateway detection

3. **Enhance UI**
   - Add loading states
   - Improve error messages
   - Add payment history

4. **Security**
   - Implement CSP headers
   - Add rate limiting
   - Validate on backend

---

## Support

For issues:
1. Check console logs
2. Verify environment variables
3. Test API endpoints
4. Review [GATEWAY_DETECTION.md](./GATEWAY_DETECTION.md)
5. Check [Troubleshooting](#troubleshooting) section

---

**🎉 Congratulations!** Your Next.js application is now integrated with the payment gateway library!
