# Universal Payments NextJS

<p align="center">
  <strong>A robust, enterprise-grade payment gateway integration package for NextJS applications</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#examples">Examples</a> •
  <a href="#migration">Migration</a>
</p>

---

## 🚀 Features

- **🎯 Multi-Gateway Support**: Stripe, Braintree, and Authorize.Net
- **⚛️ NextJS Optimized**: Built specifically for React/NextJS applications
- **🔒 Type Safe**: Full TypeScript support with comprehensive interfaces
- **🌳 Tree-Shakable**: Import only what you need for optimal bundle size
- **🎨 Customizable**: Tailwind CSS styled components with theme support
- **🔄 State Management**: Zustand-powered payment state
- **🌍 Environment Aware**: Development and production modes with auto-detection
- **📦 Easy Integration**: Simple setup with sensible defaults
- **🔐 Security First**: PCI-compliant with sensitive data sanitization
- **🧪 Well Tested**: Comprehensive test coverage with mocking support
- **📚 Well Documented**: Extensive documentation and examples

## 📦 Installation

### npm
```bash
npm install @your-company/universal-payments-nextjs
```

### yarn
```bash
yarn add @your-company/universal-payments-nextjs
```

### pnpm
```bash
pnpm add @your-company/universal-payments-nextjs
```

## ⚡ Quick Start

### 1. Basic Setup

```tsx
import { PaymentProcessor, createStripeConfig } from '@your-company/universal-payments-nextjs';

function CheckoutPage() {
  const config = createStripeConfig({
    environment: 'development',
    apiBaseUrl: 'https://your-api.com'
  });

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result.paymentIntent);
    // Redirect to success page or update UI
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error.getUserMessage());
    // Show error message to user
  };

  return (
    <PaymentProcessor
      config={config}
      amount={99.99}
      currency="USD"
      customer={{ email: 'user@example.com' }}
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />
  );
}
```

### 2. Environment Configuration

#### Option A: Configuration Builder (Recommended)
```tsx
import { PaymentConfigBuilder } from '@your-company/universal-payments-nextjs';

const config = new PaymentConfigBuilder()
  .gateway('stripe')
  .environment('production')
  .apiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL)
  .stripe({
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  })
  .logging(true, 'info')
  .timeout(30000)
  .build();
```

#### Option B: Environment Helper
```tsx
import { EnvironmentConfigHelper } from '@your-company/universal-payments-nextjs';

// Automatically reads from environment variables
const config = EnvironmentConfigHelper.fromEnvironment('stripe');
```

### 3. Individual Gateway Components

#### Stripe Checkout
```tsx
import { StripeCheckout, createStripeConfig } from '@your-company/universal-payments-nextjs';

const config = createStripeConfig({
  environment: 'production',
  apiBaseUrl: 'https://your-api.com',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
});

<StripeCheckout
  config={config}
  amount={99.99}
  onSuccess={handleSuccess}
  onError={handleError}
  customization={{
    theme: 'dark',
    buttonText: 'Complete Payment'
  }}
/>
```

#### Braintree Drop-in
```tsx
import { BraintreeDropIn, createBraintreeConfig } from '@your-company/universal-payments-nextjs';

const config = createBraintreeConfig({
  environment: 'sandbox',
  apiBaseUrl: 'https://your-api.com'
});

<BraintreeDropIn
  config={config}
  amount={99.99}
  onPaymentMethodCreated={handleBraintreeSuccess}
  onError={handleError}
/>
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in your NextJS project:

```bash
# Common
NODE_ENV=development
PAYMENT_API_BASE_URL=http://localhost:3000/api

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Braintree
BRAINTREE_MERCHANT_ID=your_merchant_id
BRAINTREE_PUBLIC_KEY=your_public_key
BRAINTREE_PRIVATE_KEY=your_private_key

# Authorize.Net
AUTHORIZE_NET_API_LOGIN_ID=your_api_login_id
AUTHORIZE_NET_TRANSACTION_KEY=your_transaction_key
AUTHORIZE_NET_CLIENT_KEY=your_client_key
```

### Gateway Configuration

Each gateway has specific configuration options:

```tsx
// Stripe Configuration
const stripeConfig = createStripeConfig({
  environment: 'production',
  apiBaseUrl: 'https://api.yoursite.com',
  publishableKey: 'pk_live_...',
  timeout: 30000,
  retryAttempts: 3
});

// Braintree Configuration
const braintreeConfig = createBraintreeConfig({
  environment: 'production',
  apiBaseUrl: 'https://api.yoursite.com',
  merchantId: 'your_merchant_id',
  timeout: 30000
});

// Authorize.Net Configuration
const authorizeNetConfig = createAuthorizeNetConfig({
  environment: 'production',
  apiBaseUrl: 'https://api.yoursite.com',
  apiLoginId: 'your_api_login_id',
  clientKey: 'your_client_key'
});
```

## 🎨 Styling & Customization

### Tailwind CSS Integration

Add the package to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@your-company/universal-payments-nextjs/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Your custom theme
    },
  },
  plugins: [],
}
```

### Theme Customization

```tsx
<PaymentProcessor
  config={config}
  amount={99.99}
  theme="dark"
  customization={{
    borderRadius: 12,
    primaryColor: '#3b82f6',
    fontFamily: 'Inter, sans-serif'
  }}
  className="custom-payment-form"
/>
```

## 🔐 Security Features

### Error Sanitization
```tsx
import { PaymentError, sanitizeErrorForLogging } from '@your-company/universal-payments-nextjs';

const handleError = (error: PaymentError) => {
  // Safe for logging - sensitive data removed
  const sanitized = sanitizeErrorForLogging(error);
  console.log(sanitized);

  // User-friendly message
  alert(error.getUserMessage());
};
```

### Validation Utilities
```tsx
import { CardValidator, validatePaymentForm } from '@your-company/universal-payments-nextjs';

// Validate individual fields
const isValid = CardValidator.isValidCardNumber('4242424242424242');
const brand = CardValidator.getCardBrand('4242424242424242'); // 'visa'

// Validate entire form
const result = validatePaymentForm({
  cardNumber: '4242424242424242',
  expiryMonth: '12',
  expiryYear: '2025',
  cvv: '123',
  holderName: 'John Doe'
});

if (!result.isValid) {
  console.log(result.errors);
}
```

## 📋 Backend Requirements

Your backend API should provide these endpoints:

### Stripe
```
POST /stripe/createCheckoutSession
GET  /stripe/retrieve-session/:sessionId
POST /stripe/webhook (optional)
```

### Braintree
```
GET  /braintree/token
POST /braintree/payment (optional)
POST /braintree/webhook (optional)
```

### Authorize.Net
```
GET  /authorize-net/credentials
POST /authorize-net/payment (optional)
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Mock Implementation

The package includes mock implementations for development:

```tsx
// Automatically uses mocks in development
const config = createStripeConfig({
  environment: 'development',
  apiBaseUrl: 'http://localhost:3000/api'
});

// Mock responses will be used automatically
```

## 📚 Advanced Usage

### Tree-Shaking

Import only what you need:

```tsx
// Import specific gateway
import { StripeService } from '@your-company/universal-payments-nextjs/stripe';

// Import specific utilities
import { CardValidator } from '@your-company/universal-payments-nextjs/utils/validation';

// Import core types only
import type { PaymentResult } from '@your-company/universal-payments-nextjs/core/types';
```

### Custom Error Handling

```tsx
import { PaymentError, PaymentErrorCode } from '@your-company/universal-payments-nextjs';

const handleError = (error: PaymentError) => {
  switch (error.code) {
    case PaymentErrorCode.PAYMENT_DECLINED:
      // Handle declined payment
      showDeclinedMessage();
      break;
    case PaymentErrorCode.NETWORK_ERROR:
      // Handle network issues
      showNetworkError();
      break;
    default:
      // Handle other errors
      showGenericError(error.getUserMessage());
  }
};
```

### State Management

```tsx
import { usePaymentMethodStore } from '@your-company/universal-payments-nextjs';

function PaymentComponent() {
  const {
    selectedPaymentMethod,
    isProcessingPayment,
    paymentError,
    setSelectedPaymentMethod,
    clearPaymentError
  } = usePaymentMethodStore();

  // Component logic
}
```

### Logging Configuration

```tsx
import { PaymentLogger, createGatewayLogger } from '@your-company/universal-payments-nextjs';

// Create custom logger
const logger = new PaymentLogger('debug', true);

// Create gateway-specific logger
const stripeLogger = createGatewayLogger('stripe', 'info');
```

## 🔄 Migration Guide

### From Custom Implementation

1. **Install the package**
   ```bash
   npm install @your-company/universal-payments-nextjs
   ```

2. **Replace existing imports**
   ```tsx
   // Before
   import PaymentProcessor from './components/PaymentProcessor';

   // After
   import { PaymentProcessor } from '@your-company/universal-payments-nextjs';
   ```

3. **Update configuration**
   ```tsx
   // Before
   <PaymentProcessor gatewayName="stripe" apiBaseUrl="..." />

   // After
   const config = createStripeConfig({ ... });
   <PaymentProcessor config={config} />
   ```

4. **Update error handling**
   ```tsx
   // Before
   onError={(error: string) => console.error(error)}

   // After
   onError={(error: PaymentError) => console.error(error.getUserMessage())}
   ```

See [INTEGRATION-EXAMPLE.md](./INTEGRATION-EXAMPLE.md) for detailed migration steps.

## 🛠️ Development

### Building
```bash
npm run build
```

### Linting & Formatting
```bash
npm run lint
npm run format
```

### Type Checking
```bash
npm run type-check
```

### Release
```bash
# Patch release (1.0.1)
npm run release:patch

# Minor release (1.1.0)
npm run release:minor

# Major release (2.0.0)
npm run release:major
```

## 📋 Requirements

- **Node.js**: >= 16.x
- **React**: >= 18.x
- **NextJS**: >= 14.x
- **TypeScript**: >= 5.x (optional but recommended)

## 🤝 Support

- **Documentation**: [Full Documentation](./docs/)
- **Examples**: [Integration Examples](./INTEGRATION-EXAMPLE.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **Issues**: [GitHub Issues](https://github.com/your-company/universal-payments-nextjs/issues)

## 📜 License

Private - Company Use Only

---

<p align="center">
  Made with ❤️ for seamless payment processing
</p>