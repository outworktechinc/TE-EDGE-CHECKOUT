# Angular Implementation Guide - Payment Gateway Library

## Complete Step-by-Step Guide for Angular

This guide provides baby steps to integrate the payment gateway library into your Angular application. Follow each step carefully to ensure nothing is missed.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Create Environment Adapter](#create-environment-adapter)
5. [Create Payment Service](#create-payment-service)
6. [Register Service in App Module](#register-service-in-app-module)
7. [Initialize at App Startup](#initialize-at-app-startup)
8. [Create Card Input Component](#create-card-input-component)
9. [Create Payment Form Component](#create-payment-form-component)
10. [Create Success Component](#create-success-component)
11. [Create Cancel Component](#create-cancel-component)
12. [Setup Routing](#setup-routing)
13. [Backend API Implementation](#backend-api-implementation)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Before you start:**

- [ ] Angular 14+ installed
- [ ] Node.js 18+ installed
- [ ] TypeScript 4.8+ configured
- [ ] Backend API ready with gateway detection endpoint
- [ ] Payment gateway credentials (Stripe/Braintree/Authorize.Net)

---

## Installation

### Step 1: Install the Library

```bash
cd your-angular-project
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

### Step 3: Update tsconfig.json

Add to `tsconfig.json` if needed:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  }
}
```

---

## Environment Configuration

### Step 4: Configure Environment Files

Edit `src/environments/environment.ts`:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,

  // API Base URL (Required)
  apiBaseUrl: 'https://mingle-stg-api.aqsatel.com',

  // Stripe Configuration
  stripePublishableKey: 'pk_test_51234567890abcdefg',

  // Braintree Configuration
  braintreeTokenUrl: '/api/braintree/token',

  // Authorize.Net Configuration
  authorizeNetClientKey: 'your_client_key_here',
  authorizeNetApiLoginId: 'your_api_login_id_here'
};
```

Edit `src/environments/environment.prod.ts`:

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,

  // Production API Base URL
  apiBaseUrl: 'https://mingle-api.aqsatel.com',

  // Production Stripe Key
  stripePublishableKey: 'pk_live_your_production_key',

  // Production Braintree
  braintreeTokenUrl: '/api/braintree/token',

  // Production Authorize.Net
  authorizeNetClientKey: 'your_production_client_key',
  authorizeNetApiLoginId: 'your_production_api_login_id'
};
```

### Step 5: Add to .gitignore

Create `src/environments/environment.local.ts` for local overrides:

```bash
# Add to .gitignore
/src/environments/environment.local.ts
```

---

## Create Environment Adapter

### Step 6: Create Adapter Service

Create `src/app/services/payment-adapter.service.ts`:

```typescript
// src/app/services/payment-adapter.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Angular Environment Adapter
 * Implements the EnvironmentAdapter interface for Angular
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentAdapterService implements EnvironmentAdapter {
  private config: GatewayConfig = {
    stripePublishableKey: environment.stripePublishableKey,
    authorizeNetClientKey: environment.authorizeNetClientKey,
    authorizeNetApiLoginId: environment.authorizeNetApiLoginId,
    braintreeClientTokenUrl: environment.braintreeTokenUrl,
    apiBaseUrl: environment.apiBaseUrl
  };

  constructor(private http: HttpClient) {}

  /**
   * Get configuration value by key
   */
  getConfig(key: keyof GatewayConfig): string | undefined {
    return this.config[key];
  }

  /**
   * Check if running in browser
   */
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Make HTTP request using Angular HttpClient
   * Convert Observable to Promise for compatibility
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const method = (options?.method || 'GET').toUpperCase();
    const headers: any = options?.headers || {};
    const body = options?.body;

    try {
      const response$ = this.http.request(method, url, {
        body: body ? JSON.parse(body as string) : undefined,
        headers: headers,
        observe: 'response',
        responseType: 'json'
      });

      const angularResponse = await firstValueFrom(response$);

      // Convert Angular HttpResponse to Fetch API Response
      const responseBody = JSON.stringify(angularResponse.body);
      const responseHeaders = new Headers();

      // Copy headers from Angular response
      angularResponse.headers.keys().forEach(key => {
        const value = angularResponse.headers.get(key);
        if (value) {
          responseHeaders.set(key, value);
        }
      });

      return new Response(responseBody, {
        status: angularResponse.status,
        statusText: angularResponse.statusText,
        headers: responseHeaders
      });
    } catch (error: any) {
      // Handle Angular HTTP errors
      const status = error.status || 500;
      const body = JSON.stringify(error.error || { error: 'Request failed' });

      return new Response(body, {
        status: status,
        statusText: error.statusText || 'Error'
      });
    }
  }
}
```

### Step 7: Verify Adapter

Create test file `src/app/services/payment-adapter.service.spec.ts`:

```typescript
// src/app/services/payment-adapter.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PaymentAdapterService } from './payment-adapter.service';

describe('PaymentAdapterService', () => {
  let service: PaymentAdapterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentAdapterService]
    });
    service = TestBed.inject(PaymentAdapterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get config values', () => {
    const apiUrl = service.getConfig('apiBaseUrl');
    expect(apiUrl).toBeDefined();
  });

  it('should detect browser environment', () => {
    const isBrowser = service.isBrowser();
    expect(isBrowser).toBe(true);
  });
});
```

---

## Create Payment Service

### Step 8: Create Payment Gateway Service

Create `src/app/services/payment-gateway.service.ts`:

```typescript
// src/app/services/payment-gateway.service.ts
import { Injectable } from '@angular/core';
import {
  PaymentGatewayManager,
  PaymentConfiguration,
  CardInput,
  StripeSessionRequest,
  PaymentEvent
} from '@your-org/payment-gateway';
import { PaymentAdapterService } from './payment-adapter.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentGatewayService {
  private manager: PaymentGatewayManager | null = null;
  private configSubject = new BehaviorSubject<PaymentConfiguration | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private errorSubject = new BehaviorSubject<Error | null>(null);

  public config$ = this.configSubject.asObservable();
  public isLoading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private adapter: PaymentAdapterService) {}

  /**
   * Initialize payment gateway
   * Should be called in APP_INITIALIZER
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Payment Gateway...');

      // Create manager instance
      this.manager = new PaymentGatewayManager(this.adapter);

      // Listen to all payment events
      this.manager.events.onAny((data) => {
        console.log(`[Payment Event] ${data.event}`, data);
      });

      // Detect active gateway from backend
      const config = await this.manager.detectGateway();

      console.log('✅ Payment Gateway Initialized');
      console.log('Gateway:', config.gatewayName);
      console.log('Method:', config.paymentMethod);
      console.log('Scenario:', config.scenario);

      this.configSubject.next(config);
      this.loadingSubject.next(false);
    } catch (error) {
      console.error('❌ Payment Gateway Initialization Failed:', error);
      this.errorSubject.next(error as Error);
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Get payment manager instance
   */
  getManager(): PaymentGatewayManager {
    if (!this.manager) {
      throw new Error('Payment gateway not initialized');
    }
    return this.manager;
  }

  /**
   * Get current configuration
   */
  getConfig(): PaymentConfiguration | null {
    return this.configSubject.value;
  }

  /**
   * Process payment based on current scenario
   */
  async getPaymentToken(input: {
    card?: CardInput;
    sessionRequest?: StripeSessionRequest;
  }): Promise<{ token: string; tokenType: string; gatewayName: string }> {
    if (!this.manager) {
      throw new Error('Payment gateway not initialized');
    }

    return await this.manager.getPaymentMethodToken(input);
  }

  /**
   * Check if Edge Checkout UI is required
   */
  requiresEdgeCheckout(): boolean {
    return this.manager?.requiresEdgeCheckout() ?? false;
  }

  /**
   * Check if Stripe redirect flow
   */
  requiresStripeRedirect(): boolean {
    return this.manager?.requiresStripeRedirect() ?? false;
  }

  /**
   * Extract Stripe session ID from URL
   */
  extractStripeSessionId(url?: string): string | null {
    return this.manager?.extractStripeSessionId(url) ?? null;
  }

  /**
   * Check if current URL is Stripe success redirect
   */
  isStripeSuccessRedirect(url?: string): boolean {
    return this.manager?.isStripeSuccessRedirect(url) ?? false;
  }

  /**
   * Check if current URL is Stripe cancel redirect
   */
  isStripeCancelRedirect(url?: string): boolean {
    return this.manager?.isStripeCancelRedirect(url) ?? false;
  }
}
```

---

## Register Service in App Module

### Step 9: Configure App Module

Edit `src/app/app.module.ts`:

```typescript
// src/app/app.module.ts
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { PaymentAdapterService } from './services/payment-adapter.service';

/**
 * Initialize payment gateway on app startup
 */
export function initializePaymentGateway(
  paymentService: PaymentGatewayService
): () => Promise<void> {
  return () => paymentService.initialize();
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    PaymentAdapterService,
    PaymentGatewayService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializePaymentGateway,
      deps: [PaymentGatewayService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## Initialize at App Startup

### Step 10: Update App Component

Edit `src/app/app.component.ts`:

```typescript
// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { PaymentGatewayService } from './services/payment-gateway.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'your-app';
  paymentReady = false;
  paymentError: string | null = null;

  constructor(private paymentService: PaymentGatewayService) {}

  ngOnInit(): void {
    // Subscribe to payment gateway state
    this.paymentService.isLoading$.subscribe(loading => {
      if (!loading) {
        const config = this.paymentService.getConfig();
        if (config) {
          this.paymentReady = true;
          console.log('Payment gateway ready:', config);
        }
      }
    });

    this.paymentService.error$.subscribe(error => {
      if (error) {
        this.paymentError = error.message;
        console.error('Payment gateway error:', error);
      }
    });
  }
}
```

---

## Create Card Input Component

### Step 11: Generate Card Input Component

```bash
ng generate component components/card-input
```

Edit `src/app/components/card-input/card-input.component.ts`:

```typescript
// src/app/components/card-input/card-input.component.ts
import { Component, Output, EventEmitter, Input } from '@angular/core';
import {
  CardInput,
  validateCard,
  detectCardBrand,
  getCardIcon,
  CardBrand
} from '@your-org/payment-gateway';

@Component({
  selector: 'app-card-input',
  templateUrl: './card-input.component.html',
  styleUrls: ['./card-input.component.css']
})
export class CardInputComponent {
  @Output() cardChange = new EventEmitter<CardInput>();
  @Input() disabled = false;

  card: CardInput = {
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  };

  errors: string[] = [];
  cardBrand: CardBrand = 'unknown';
  cardIconUrl = '';

  onCardNumberChange(value: string): void {
    this.card.number = value.replace(/\D/g, '').slice(0, 16);
    this.cardBrand = detectCardBrand(this.card.number);
    this.cardIconUrl = getCardIcon(this.cardBrand);
    this.emitCard();
    this.validateCardInput();
  }

  onExpMonthChange(value: string): void {
    this.card.expMonth = value.replace(/\D/g, '').slice(0, 2);
    this.emitCard();
    this.validateCardInput();
  }

  onExpYearChange(value: string): void {
    this.card.expYear = value.replace(/\D/g, '').slice(0, 4);
    this.emitCard();
    this.validateCardInput();
  }

  onCvcChange(value: string): void {
    this.card.cvc = value.replace(/\D/g, '').slice(0, 4);
    this.emitCard();
    this.validateCardInput();
  }

  private emitCard(): void {
    this.cardChange.emit(this.card);
  }

  private validateCardInput(): void {
    const validation = validateCard(this.card);
    this.errors = validation.isValid ? [] : validation.errors;
  }

  formatCardNumber(value: string): string {
    return value.replace(/(\d{4})/g, '$1 ').trim();
  }
}
```

Edit `src/app/components/card-input/card-input.component.html`:

```html
<!-- src/app/components/card-input/card-input.component.html -->
<div class="card-input-container">
  <div class="card-number-field">
    <label for="cardNumber">Card Number</label>
    <div class="card-number-input">
      <input
        id="cardNumber"
        type="text"
        placeholder="1234 5678 9012 3456"
        [value]="formatCardNumber(card.number)"
        (input)="onCardNumberChange($any($event.target).value)"
        [disabled]="disabled"
        maxlength="19"
      />
      <img
        *ngIf="cardBrand !== 'unknown'"
        [src]="cardIconUrl"
        [alt]="cardBrand"
        class="card-icon"
      />
    </div>
  </div>

  <div class="card-details-row">
    <div class="expiry-field">
      <label for="expMonth">Expiry</label>
      <div class="expiry-inputs">
        <input
          id="expMonth"
          type="text"
          placeholder="MM"
          [value]="card.expMonth"
          (input)="onExpMonthChange($any($event.target).value)"
          [disabled]="disabled"
          maxlength="2"
        />
        <span class="expiry-separator">/</span>
        <input
          id="expYear"
          type="text"
          placeholder="YYYY"
          [value]="card.expYear"
          (input)="onExpYearChange($any($event.target).value)"
          [disabled]="disabled"
          maxlength="4"
        />
      </div>
    </div>

    <div class="cvc-field">
      <label for="cvc">CVC</label>
      <input
        id="cvc"
        type="text"
        placeholder="123"
        [value]="card.cvc"
        (input)="onCvcChange($any($event.target).value)"
        [disabled]="disabled"
        maxlength="4"
      />
    </div>
  </div>

  <div *ngIf="errors.length > 0" class="errors">
    <p *ngFor="let error of errors" class="error">{{ error }}</p>
  </div>
</div>
```

Edit `src/app/components/card-input/card-input.component.css`:

```css
/* src/app/components/card-input/card-input.component.css */
.card-input-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.card-number-field label,
.expiry-field label,
.cvc-field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.card-number-input {
  position: relative;
  display: flex;
  align-items: center;
}

.card-number-input input {
  flex: 1;
  padding: 12px 45px 12px 12px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
}

.card-number-input input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.card-icon {
  position: absolute;
  right: 12px;
  width: 40px;
  height: 26px;
  object-fit: contain;
}

.card-details-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.expiry-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expiry-inputs input {
  width: 60px;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  text-align: center;
}

.expiry-separator {
  font-size: 18px;
  color: #6b7280;
  font-weight: 500;
}

.cvc-field input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  text-align: center;
}

.expiry-inputs input:focus,
.cvc-field input:focus {
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

### Step 12: Generate Payment Form Component

```bash
ng generate component components/payment-form
```

Edit `src/app/components/payment-form/payment-form.component.ts`:

```typescript
// src/app/components/payment-form/payment-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PaymentGatewayService } from '../../services/payment-gateway.service';
import { CardInput, PaymentConfiguration } from '@your-org/payment-gateway';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.css']
})
export class PaymentFormComponent implements OnInit {
  @Input() amount = 0;
  @Input() currency = 'USD';
  @Output() success = new EventEmitter<{ token: string; tokenType: string }>();
  @Output() error = new EventEmitter<string>();

  config: PaymentConfiguration | null = null;
  isLoading = false;
  processing = false;
  needsCardInput = false;
  isStripeRedirect = false;

  card: CardInput = {
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  };

  constructor(private paymentService: PaymentGatewayService) {}

  ngOnInit(): void {
    this.paymentService.config$.subscribe(config => {
      this.config = config;
      this.needsCardInput = this.paymentService.requiresEdgeCheckout();
      this.isStripeRedirect = this.paymentService.requiresStripeRedirect();
    });

    this.paymentService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });
  }

  onCardChange(card: CardInput): void {
    this.card = card;
  }

  async onSubmit(): Promise<void> {
    this.processing = true;

    try {
      let result;

      if (
        this.config?.scenario === 'stripe-session' ||
        this.config?.scenario === 'stripe-redirect'
      ) {
        // Stripe scenarios
        result = await this.paymentService.getPaymentToken({
          sessionRequest: {
            amount: Math.round(this.amount * 100), // Convert to cents
            currency: this.currency,
            successUrl: window.location.origin + '/payment/success',
            cancelUrl: window.location.origin + '/payment/cancel'
          }
        });
      } else {
        // Edge Checkout scenarios
        result = await this.paymentService.getPaymentToken({
          card: this.card
        });
      }

      this.success.emit({
        token: result.token,
        tokenType: result.tokenType
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      this.error.emit(errorMessage);
    } finally {
      this.processing = false;
    }
  }
}
```

Edit `src/app/components/payment-form/payment-form.component.html`:

```html
<!-- src/app/components/payment-form/payment-form.component.html -->
<form (ngSubmit)="onSubmit()" class="payment-form">
  <h2 class="title">Payment Details</h2>

  <div *ngIf="isLoading" class="loading">
    <p>Loading payment configuration...</p>
  </div>

  <div *ngIf="!isLoading && config" class="form-content">
    <div class="info">
      <p><strong>Amount:</strong> ${{ amount.toFixed(2) }} {{ currency }}</p>
      <p><strong>Gateway:</strong> {{ config.gatewayName }}</p>
      <p><strong>Method:</strong> {{ config.paymentMethod }}</p>
    </div>

    <div *ngIf="needsCardInput" class="card-section">
      <app-card-input
        (cardChange)="onCardChange($event)"
        [disabled]="processing"
      ></app-card-input>
    </div>

    <div *ngIf="isStripeRedirect" class="notice">
      <p>You will be redirected to Stripe to complete your payment.</p>
    </div>

    <button
      type="submit"
      [disabled]="processing"
      class="submit-button"
    >
      {{ processing ? 'Processing...' : 'Pay $' + amount.toFixed(2) }}
    </button>
  </div>
</form>
```

Edit `src/app/components/payment-form/payment-form.component.css`:

```css
/* src/app/components/payment-form/payment-form.component.css */
.payment-form {
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

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
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

.card-section {
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

.submit-button {
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

.submit-button:hover:not(:disabled) {
  background: #2563eb;
}

.submit-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
```

---

## Create Success Component

### Step 13: Generate Success Component

```bash
ng generate component pages/payment-success
```

Edit `src/app/pages/payment-success/payment-success.component.ts`:

```typescript
// src/app/pages/payment-success/payment-success.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PaymentGatewayService } from '../../services/payment-gateway.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  sessionId: string | null = null;
  verifying = true;
  verified = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private paymentService: PaymentGatewayService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Check if this is a Stripe redirect success
      if (this.paymentService.isStripeSuccessRedirect()) {
        this.sessionId = this.paymentService.extractStripeSessionId();

        if (this.sessionId) {
          // Verify payment with backend
          this.http.post<any>('/api/payments/verify', {
            sessionId: this.sessionId
          }).subscribe({
            next: () => {
              this.verified = true;
              this.verifying = false;
            },
            error: (err) => {
              this.error = 'Payment verification failed';
              this.verifying = false;
            }
          });
        } else {
          this.error = 'Session ID not found';
          this.verifying = false;
        }
      } else {
        // Direct success (non-redirect flow)
        this.verified = true;
        this.verifying = false;
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      this.error = 'Failed to verify payment';
      this.verifying = false;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
```

Edit `src/app/pages/payment-success/payment-success.component.html`:

```html
<!-- src/app/pages/payment-success/payment-success.component.html -->
<div class="container">
  <div class="card">
    <!-- Verifying State -->
    <div *ngIf="verifying" class="spinner-container">
      <div class="spinner"></div>
      <h1>Verifying Payment...</h1>
      <p>Please wait while we confirm your payment.</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!verifying && error" class="error-container">
      <div class="error-icon">❌</div>
      <h1>Verification Failed</h1>
      <p>{{ error }}</p>
      <button (click)="goHome()">Return Home</button>
    </div>

    <!-- Success State -->
    <div *ngIf="!verifying && !error && verified" class="success-container">
      <div class="success-icon">✅</div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your payment.</p>
      <p *ngIf="sessionId" class="session-id">
        Session ID: {{ sessionId.substring(0, 20) }}...
      </p>
      <button (click)="goHome()">Return Home</button>
    </div>
  </div>
</div>
```

Edit `src/app/pages/payment-success/payment-success.component.css`:

```css
/* src/app/pages/payment-success/payment-success.component.css */
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

.success-icon,
.error-icon {
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

h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
}

.session-id {
  font-size: 12px;
  font-family: monospace;
  color: #9ca3af;
  word-break: break-all;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}
```

---

## Create Cancel Component

### Step 14: Generate Cancel Component

```bash
ng generate component pages/payment-cancel
```

Edit `src/app/pages/payment-cancel/payment-cancel.component.ts`:

```typescript
// src/app/pages/payment-cancel/payment-cancel.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  templateUrl: './payment-cancel.component.html',
  styleUrls: ['./payment-cancel.component.css']
})
export class PaymentCancelComponent {
  constructor(private router: Router) {}

  tryAgain(): void {
    this.router.navigate(['/checkout']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
```

Edit `src/app/pages/payment-cancel/payment-cancel.component.html`:

```html
<!-- src/app/pages/payment-cancel/payment-cancel.component.html -->
<div class="container">
  <div class="card">
    <div class="cancel-icon">⚠️</div>
    <h1>Payment Canceled</h1>
    <p>Your payment was canceled. No charges were made.</p>
    <div class="actions">
      <button (click)="tryAgain()">Try Again</button>
      <button (click)="goHome()" class="secondary">Return Home</button>
    </div>
  </div>
</div>
```

Edit `src/app/pages/payment-cancel/payment-cancel.component.css`:

```css
/* src/app/pages/payment-cancel/payment-cancel.component.css */
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

.cancel-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}

.secondary {
  background: #6b7280;
}

.secondary:hover {
  background: #4b5563;
}
```

---

## Setup Routing

### Step 15: Configure Routes

Edit `src/app/app-routing.module.ts`:

```typescript
// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentSuccessComponent } from './pages/payment-success/payment-success.component';
import { PaymentCancelComponent } from './pages/payment-cancel/payment-cancel.component';

const routes: Routes = [
  {
    path: 'payment/success',
    component: PaymentSuccessComponent
  },
  {
    path: 'payment/cancel',
    component: PaymentCancelComponent
  },
  {
    path: '',
    redirectTo: '/checkout',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### Step 16: Create Checkout Page

```bash
ng generate component pages/checkout
```

Edit `src/app/pages/checkout/checkout.component.ts`:

```typescript
// src/app/pages/checkout/checkout.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  paymentStatus: 'idle' | 'success' | 'error' = 'idle';
  errorMessage = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  onPaymentSuccess(data: { token: string; tokenType: string }): void {
    console.log('✅ Payment Token Received');
    console.log('Token:', data.token);
    console.log('Type:', data.tokenType);

    // Send to backend for processing
    this.http.post<any>('/api/payments/process', {
      token: data.token,
      tokenType: data.tokenType,
      amount: 1999 // $19.99
    }).subscribe({
      next: () => {
        this.paymentStatus = 'success';
        setTimeout(() => {
          this.router.navigate(['/payment/success']);
        }, 1500);
      },
      error: (err) => {
        this.onPaymentError('Failed to process payment');
      }
    });
  }

  onPaymentError(error: string): void {
    console.error('❌ Payment Error:', error);
    this.paymentStatus = 'error';
    this.errorMessage = error;
  }
}
```

Edit `src/app/pages/checkout/checkout.component.html`:

```html
<!-- src/app/pages/checkout/checkout.component.html -->
<div class="container">
  <div class="content">
    <h1>Checkout</h1>

    <div *ngIf="paymentStatus === 'success'" class="success-message">
      Payment successful! Redirecting...
    </div>

    <div *ngIf="paymentStatus === 'error'" class="error-message">
      {{ errorMessage }}
    </div>

    <app-payment-form
      [amount]="19.99"
      currency="USD"
      (success)="onPaymentSuccess($event)"
      (error)="onPaymentError($event)"
    ></app-payment-form>
  </div>
</div>
```

Add to routes in `app-routing.module.ts`:

```typescript
import { CheckoutComponent } from './pages/checkout/checkout.component';

const routes: Routes = [
  {
    path: 'checkout',
    component: CheckoutComponent
  },
  // ... other routes
];
```

---

## Backend API Implementation

### Step 17: Update App Module Declarations

Edit `src/app/app.module.ts` to include all new components:

```typescript
import { CardInputComponent } from './components/card-input/card-input.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { PaymentSuccessComponent } from './pages/payment-success/payment-success.component';
import { PaymentCancelComponent } from './pages/payment-cancel/payment-cancel.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';

@NgModule({
  declarations: [
    AppComponent,
    CardInputComponent,
    PaymentFormComponent,
    PaymentSuccessComponent,
    PaymentCancelComponent,
    CheckoutComponent
  ],
  // ...
})
```

---

## Testing

### Step 18: Run Development Server

```bash
ng serve
```

### Step 19: Test Configuration

Create a test component:

```bash
ng generate component pages/test-payment
```

Edit `src/app/pages/test-payment/test-payment.component.ts`:

```typescript
// src/app/pages/test-payment/test-payment.component.ts
import { Component, OnInit } from '@angular/core';
import { PaymentGatewayService } from '../../services/payment-gateway.service';
import { PaymentConfiguration } from '@your-org/payment-gateway';

@Component({
  selector: 'app-test-payment',
  template: `
    <div style="padding: 20px; font-family: monospace;">
      <h1>Payment Configuration Test</h1>

      <div *ngIf="isLoading">
        <p>Loading payment configuration...</p>
      </div>

      <div *ngIf="error">
        <h2 style="color: red;">Error</h2>
        <pre>{{ error }}</pre>
      </div>

      <div *ngIf="config">
        <h2>✅ Payment Manager Initialized</h2>

        <h3>Configuration:</h3>
        <pre>{{ configJson }}</pre>

        <h3>Feature Checks:</h3>
        <ul>
          <li>Requires Edge Checkout: {{ requiresEdgeCheckout ? 'Yes' : 'No' }}</li>
          <li>Requires Stripe Redirect: {{ requiresStripeRedirect ? 'Yes' : 'No' }}</li>
        </ul>
      </div>
    </div>
  `
})
export class TestPaymentComponent implements OnInit {
  config: PaymentConfiguration | null = null;
  configJson = '';
  isLoading = true;
  error = '';
  requiresEdgeCheckout = false;
  requiresStripeRedirect = false;

  constructor(private paymentService: PaymentGatewayService) {}

  ngOnInit(): void {
    this.paymentService.config$.subscribe(config => {
      this.config = config;
      this.configJson = JSON.stringify(config, null, 2);
      this.requiresEdgeCheckout = this.paymentService.requiresEdgeCheckout();
      this.requiresStripeRedirect = this.paymentService.requiresStripeRedirect();
    });

    this.paymentService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });

    this.paymentService.error$.subscribe(error => {
      if (error) {
        this.error = error.message;
      }
    });
  }
}
```

Add to routes and test:

```bash
# Visit http://localhost:4200/test-payment
```

### Step 20: Run Tests

```bash
ng test
```

---

## Troubleshooting

### Issue: "Cannot find module '@your-org/payment-gateway'"

**Solution:**
```bash
# Reinstall the package
npm install ../payment-gateway-library --save

# Or if published
npm install @your-org/payment-gateway
```

### Issue: "APP_INITIALIZER not working"

**Solution:**
```typescript
// Ensure APP_INITIALIZER returns a function that returns a Promise
export function initializePaymentGateway(
  paymentService: PaymentGatewayService
): () => Promise<void> {
  return () => paymentService.initialize();
}
```

### Issue: "HttpClient not provided"

**Solution:**
```typescript
// Ensure HttpClientModule is imported in app.module.ts
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    HttpClientModule,
    // ...
  ]
})
```

### Issue: "CORS error when calling API"

**Solution:**
```typescript
// Backend must allow CORS
// Or use Angular proxy in development

// Create proxy.conf.json
{
  "/api": {
    "target": "https://mingle-stg-api.aqsatel.com",
    "secure": false,
    "changeOrigin": true
  }
}

// Update angular.json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

---

## Checklist

Before going to production:

- [ ] Environment variables configured (dev & prod)
- [ ] Payment adapter service created
- [ ] Payment gateway service created
- [ ] APP_INITIALIZER configured
- [ ] All components created and registered
- [ ] Routing configured
- [ ] Gateway detection tested
- [ ] All 4 scenarios tested
- [ ] Success/cancel pages working
- [ ] Backend endpoints ready
- [ ] Error handling implemented
- [ ] Production API keys added
- [ ] HTTPS enabled
- [ ] Build tested (`ng build --prod`)

---

## Build for Production

```bash
# Build for production
ng build --configuration production

# Test production build
npm install -g http-server
cd dist/your-app
http-server -p 8080
```

---

## Next Steps

1. **Backend Implementation**
   - Gateway detection endpoint
   - Stripe session creation
   - Payment verification
   - Webhook handlers

2. **Testing**
   - Unit tests for services
   - Component tests
   - E2E tests for payment flows

3. **Monitoring**
   - Add analytics
   - Error tracking (Sentry)
   - Payment metrics

4. **Security**
   - CSP headers
   - Rate limiting
   - Input validation

---

**🎉 Congratulations!** Your Angular application is now integrated with the payment gateway library!
