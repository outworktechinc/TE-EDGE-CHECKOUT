# Library Enhancement Recommendations

Based on analysis of your current Next.js implementation, here are recommendations to make the payment gateway library more robust and feature-complete.

## Current Implementation Analysis

### ✅ What's Already Working Well

1. **Gateway Detection System**
   - API-based gateway detection (`getActiveGateway()`, `getPaymentThrough()`)
   - LocalStorage caching for performance
   - Post-login initialization (`runAfterLoginOnHome()`)

2. **Multi-Gateway Support**
   - Stripe (with Elements and Edge Checkout)
   - Braintree (with tokenization)
   - Authorize.Net (with Accept.js)

3. **Edge Checkout Card Input**
   - Custom card input component (`EdgeCheckoutCardInput`)
   - Card type detection (Visa, MasterCard, Amex, Discover)
   - Formatted expiry date (YYYY-MM)
   - CVV validation

4. **Payment Flows**
   - Plan purchase with new card
   - Plan purchase with saved card
   - Top-up/Add-on purchase
   - Auto-renew activation
   - Subscription renewal

## 🚀 Recommended Enhancements

### 1. **Card Validation Enhancement**

**Current Gap:** Basic client-side validation only

**Add to Library:**

```typescript
// src/utils/card-validation.ts

export interface CardValidationResult {
  isValid: boolean;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  errors: string[];
}

/**
 * Luhn algorithm for card number validation
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card type from number
 */
export function detectCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');

  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]|^2(22[1-9]|2[3-9]|[3-6]|7[01]|720)/,
    amex: /^3[47]/,
    discover: /^6011|^64[4-9]|^65|^622/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^35/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type;
    }
  }

  return 'unknown';
}

/**
 * Validate expiry date
 */
export function validateExpiryDate(month: string, year: string): boolean {
  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year, 10);

  if (expMonth < 1 || expMonth > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Handle 2-digit year
  const fullYear = expYear < 100 ? 2000 + expYear : expYear;

  if (fullYear < currentYear) {
    return false;
  }

  if (fullYear === currentYear && expMonth < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Validate CVV
 */
export function validateCVV(cvv: string, cardType: string): boolean {
  const cleaned = cvv.replace(/\D/g, '');

  // Amex requires 4 digits, others 3
  if (cardType === 'amex') {
    return cleaned.length === 4;
  }

  return cleaned.length === 3;
}

/**
 * Comprehensive card validation
 */
export function validateCard(card: {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}): CardValidationResult {
  const errors: string[] = [];

  // Validate card number
  if (!validateCardNumber(card.number)) {
    errors.push('Invalid card number');
  }

  // Detect card type
  const cardType = detectCardType(card.number);

  // Validate expiry
  if (!validateExpiryDate(card.expMonth, card.expYear)) {
    errors.push('Card is expired or invalid expiry date');
  }

  // Validate CVV
  if (!validateCVV(card.cvc, cardType)) {
    errors.push(`Invalid CVV (${cardType === 'amex' ? '4' : '3'} digits required)`);
  }

  return {
    isValid: errors.length === 0,
    cardType: cardType as any,
    errors
  };
}
```

**Usage in Library:**

```typescript
// In createPaymentToken method
import { validateCard } from './utils/card-validation';

async createPaymentToken(card: CardInput, gatewayName: GatewayName): Promise<TokenResult> {
  // Validate card before tokenization
  const validation = validateCard(card);

  if (!validation.isValid) {
    throw new PaymentError(
      PaymentErrorCode.INVALID_CARD,
      validation.errors.join(', ')
    );
  }

  // Continue with tokenization...
}
```

---

### 2. **Retry Logic & Resilience**

**Current Gap:** No automatic retry for transient failures

**Add to Library:**

```typescript
// src/utils/retry.ts

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: PaymentErrorCode[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = [
      PaymentErrorCode.NETWORK_ERROR,
      PaymentErrorCode.SDK_LOAD_FAILED
    ]
  } = options;

  let lastError: any;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (error instanceof PaymentError && !retryableErrors.includes(error.code)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      console.debug(`[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}
```

**Usage:**

```typescript
// In gateway initialization
await withRetry(
  () => loadScript(STRIPE_JS_URL, adapter),
  { maxAttempts: 3, delayMs: 1000 }
);
```

---

### 3. **Address Validation**

**Current Gap:** No address validation, seen in your implementation

**Add to Library:**

```typescript
// src/types/index.ts - Add billing address types

export interface BillingAddress {
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
}

// src/utils/address-validation.ts

export function validateAddress(address: BillingAddress): AddressValidationResult {
  const errors: string[] = [];

  if (!address.firstName?.trim()) {
    errors.push('First name is required');
  }

  if (!address.lastName?.trim()) {
    errors.push('Last name is required');
  }

  if (!address.address?.trim()) {
    errors.push('Address is required');
  }

  if (!address.city?.trim()) {
    errors.push('City is required');
  }

  if (!address.state?.trim()) {
    errors.push('State is required');
  } else if (address.country === 'US' && address.state.length !== 2) {
    errors.push('State must be 2-letter code (e.g., CA, NY)');
  }

  if (!address.zip?.trim()) {
    errors.push('ZIP code is required');
  } else if (address.country === 'US' && !/^\d{5}(-\d{4})?$/.test(address.zip)) {
    errors.push('Invalid US ZIP code format');
  }

  if (!address.country?.trim()) {
    errors.push('Country is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

### 4. **Saved Card Management**

**Current Gap:** No support for saved cards in library

**Add to Library:**

```typescript
// src/types/index.ts

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault?: boolean;
}

export interface SavedCardOptions {
  customerId: string;
  paymentProfileId?: string;
}

// src/saved-cards.ts

export class SavedCardManager {
  constructor(private adapter: EnvironmentAdapter) {}

  /**
   * Fetch saved cards from backend
   */
  async getSavedCards(options: SavedCardOptions): Promise<SavedCard[]> {
    const apiBaseUrl = this.adapter.getConfig('apiBaseUrl') || '';
    const url = `${apiBaseUrl}/api/customer/payment-profiles`;

    const response = await this.adapter.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    const data = await response.json();
    return data.cards || [];
  }

  /**
   * Create payment token using saved card
   */
  async createTokenFromSavedCard(
    cardId: string,
    cvv: string,
    gatewayName: GatewayName
  ): Promise<string> {
    // Implementation depends on gateway
    // For Stripe: use setupIntent or payment method
    // For Braintree/Authorize.Net: use CVV + payment profile ID
    throw new Error('Not implemented');
  }
}
```

---

### 5. **Transaction Logging & Debugging**

**Current Gap:** Limited logging capabilities

**Add to Library:**

```typescript
// src/utils/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  gateway?: string;
}

export class PaymentLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private logLevel: LogLevel = LogLevel.INFO;

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  debug(message: string, data?: any, gateway?: string) {
    this.log(LogLevel.DEBUG, message, data, gateway);
  }

  info(message: string, data?: any, gateway?: string) {
    this.log(LogLevel.INFO, message, data, gateway);
  }

  warn(message: string, data?: any, gateway?: string) {
    this.log(LogLevel.WARN, message, data, gateway);
  }

  error(message: string, data?: any, gateway?: string) {
    this.log(LogLevel.ERROR, message, data, gateway);
  }

  private log(level: LogLevel, message: string, data?: any, gateway?: string) {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      gateway
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const levelStr = LogLevel[level];
    const prefix = gateway ? `[${gateway}]` : '[Payment]';
    console.log(`${prefix} [${levelStr}] ${message}`, data || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global logger instance
export const logger = new PaymentLogger();
```

**Usage:**

```typescript
import { logger } from './utils/logger';

async createPaymentToken(card: CardInput, gatewayName: GatewayName): Promise<TokenResult> {
  logger.info('Creating payment token', { gateway: gatewayName }, gatewayName);

  try {
    const token = await this.tokenize(card, gatewayName);
    logger.info('Payment token created successfully', { tokenPrefix: token.substring(0, 10) }, gatewayName);
    return { token, gatewayName };
  } catch (error) {
    logger.error('Payment tokenization failed', error, gatewayName);
    throw error;
  }
}
```

---

### 6. **Event System / Hooks**

**Current Gap:** No way to hook into payment lifecycle events

**Add to Library:**

```typescript
// src/events.ts

export enum PaymentEvent {
  GATEWAY_INITIALIZED = 'gateway_initialized',
  TOKENIZATION_STARTED = 'tokenization_started',
  TOKENIZATION_SUCCESS = 'tokenization_success',
  TOKENIZATION_FAILED = 'tokenization_failed',
  PAYMENT_STARTED = 'payment_started',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed'
}

export interface PaymentEventData {
  event: PaymentEvent;
  timestamp: Date;
  gateway?: GatewayName;
  data?: any;
  error?: Error;
}

type EventCallback = (data: PaymentEventData) => void;

export class PaymentEventEmitter {
  private listeners: Map<PaymentEvent, EventCallback[]> = new Map();

  on(event: PaymentEvent, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: PaymentEvent, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: PaymentEvent, data: Partial<PaymentEventData> = {}) {
    const eventData: PaymentEventData = {
      event,
      timestamp: new Date(),
      ...data
    };

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(eventData));
    }
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}
```

**Usage:**

```typescript
// In PaymentGatewayManager
export class PaymentGatewayManager {
  public events = new PaymentEventEmitter();

  async createPaymentToken(card: CardInput, gateway: GatewayName): Promise<TokenResult> {
    this.events.emit(PaymentEvent.TOKENIZATION_STARTED, { gateway });

    try {
      const result = await this.tokenize(card, gateway);
      this.events.emit(PaymentEvent.TOKENIZATION_SUCCESS, { gateway, data: result });
      return result;
    } catch (error) {
      this.events.emit(PaymentEvent.TOKENIZATION_FAILED, { gateway, error: error as Error });
      throw error;
    }
  }
}

// In application code
paymentGateway.events.on(PaymentEvent.TOKENIZATION_SUCCESS, (data) => {
  console.log('Payment tokenized successfully:', data);
  // Send analytics event
  analytics.track('payment_token_created', { gateway: data.gateway });
});
```

---

### 7. **3D Secure (SCA) Support**

**Current Gap:** No Strong Customer Authentication support

**Add to Library:**

```typescript
// src/types/index.ts

export interface ThreeDSResult {
  requiresAction: boolean;
  clientSecret?: string;
  status: 'succeeded' | 'requires_action' | 'failed';
}

// src/gateways/stripe-3ds.ts

export async function handleStripe3DS(
  paymentIntentClientSecret: string,
  stripe: any
): Promise<ThreeDSResult> {
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    paymentIntentClientSecret
  );

  if (error) {
    return {
      requiresAction: false,
      status: 'failed'
    };
  }

  if (paymentIntent.status === 'requires_action') {
    return {
      requiresAction: true,
      clientSecret: paymentIntentClientSecret,
      status: 'requires_action'
    };
  }

  return {
    requiresAction: false,
    status: 'succeeded'
  };
}
```

---

### 8. **Payment Method Icons/Assets**

**Current Gap:** Hardcoded image paths

**Add to Library:**

```typescript
// src/utils/card-icons.ts

export const CARD_ICONS = {
  visa: 'data:image/svg+xml;base64,...',
  mastercard: 'data:image/svg+xml;base64,...',
  amex: 'data:image/svg+xml;base64,...',
  discover: 'data:image/svg+xml;base64,...',
  // ... other card brands
} as const;

export function getCardIcon(cardType: string): string {
  return CARD_ICONS[cardType.toLowerCase() as keyof typeof CARD_ICONS] || '';
}

export function getCardBrandName(cardType: string): string {
  const names: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB'
  };
  return names[cardType.toLowerCase()] || 'Unknown';
}
```

---

### 9. **Amount Formatting Utilities**

**Current Gap:** No currency formatting

**Add to Library:**

```typescript
// src/utils/currency.ts

export interface CurrencyOptions {
  currency?: string;
  locale?: string;
  decimals?: number;
}

export function formatCurrency(
  amount: number,
  options: CurrencyOptions = {}
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    decimals = 2
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

export function parseCurrency(formattedAmount: string): number {
  // Remove currency symbols and parse
  const cleaned = formattedAmount.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
}

export function centsToUSD(cents: number): string {
  return formatCurrency(cents / 100);
}

export function usdToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
```

---

### 10. **Testing Utilities**

**Current Gap:** No test helpers

**Add to Library:**

```typescript
// src/test-utils.ts

export const TEST_CARDS = {
  stripe: {
    success: '4242424242424242',
    decline: '4000000000000002',
    insufficientFunds: '4000000000009995',
    lostCard: '4000000000009987',
    stolenCard: '4000000000009979'
  },
  braintree: {
    success: '4111111111111111',
    decline: '4000111111111115',
    processorDecline: '4000111111111127'
  },
  authorizenet: {
    success: '4007000000027',
    decline: '4222222222222'
  }
};

export function getTestCard(gateway: GatewayName, scenario: 'success' | 'decline' = 'success') {
  const cards = {
    'Stripe': TEST_CARDS.stripe,
    'Braintree': TEST_CARDS.braintree,
    'Authorize.Net': TEST_CARDS.authorizenet
  };

  return {
    number: cards[gateway][scenario],
    expMonth: '12',
    expYear: '2025',
    cvc: '123'
  };
}

export function createMockAdapter(config: Partial<GatewayConfig> = {}): EnvironmentAdapter {
  return {
    getConfig: (key) => (config as any)[key],
    isBrowser: () => true,
    fetch: async (url, options) => {
      // Mock fetch implementation
      return new Response(JSON.stringify({ success: true }), {
        status: 200
      });
    }
  };
}
```

---

## 📊 Priority Matrix

| Feature | Priority | Impact | Effort | Status |
|---------|----------|--------|--------|--------|
| Card Validation | **HIGH** | High | Low | Recommended |
| Retry Logic | **HIGH** | High | Medium | Recommended |
| Event System | **MEDIUM** | High | Medium | Recommended |
| Logging | **MEDIUM** | Medium | Low | Recommended |
| Address Validation | **MEDIUM** | Medium | Low | Recommended |
| Saved Cards | **HIGH** | High | High | Recommended |
| 3D Secure | **LOW** | Medium | High | Future |
| Test Utilities | **MEDIUM** | Medium | Low | Recommended |
| Currency Utils | **LOW** | Low | Low | Nice to have |
| Card Icons | **LOW** | Low | Low | Nice to have |

---

## 🎯 Implementation Roadmap

### Phase 1: Core Enhancements (Week 1-2)
- ✅ Card validation
- ✅ Retry logic
- ✅ Address validation
- ✅ Logging system

### Phase 2: Developer Experience (Week 3)
- ✅ Event system
- ✅ Test utilities
- ✅ Better error messages

### Phase 3: Advanced Features (Week 4+)
- ✅ Saved card management
- ✅ 3D Secure support
- ✅ Multi-currency support
- ✅ Webhook handlers

---

## 💡 Additional Suggestions

### 11. **TypeScript Strict Mode**
Enable strict mode in tsconfig.json for better type safety.

### 12. **Bundle Size Optimization**
- Tree-shakeable exports
- Code splitting by gateway
- Optional dependencies

### 13. **Security Enhancements**
- CSP (Content Security Policy) headers documentation
- PCI compliance checklist
- Security audit guide

### 14. **Performance Monitoring**
- SDK load time tracking
- Tokenization performance metrics
- Error rate monitoring

### 15. **Documentation**
- JSDoc comments for all public APIs
- Migration guide from v1 to v2
- Troubleshooting guide
- FAQ section

---

## 🔒 Security Checklist

- [ ] Never log full card numbers
- [ ] Use HTTPS only in production
- [ ] Implement rate limiting
- [ ] Add request timeout
- [ ] Validate all inputs
- [ ] Sanitize error messages
- [ ] Implement CSP headers
- [ ] Regular security audits

---

Would you like me to implement any of these enhancements in the library?
