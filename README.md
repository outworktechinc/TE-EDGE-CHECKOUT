# Universal Payments NextJS

A comprehensive payment gateway integration package for NextJS applications, supporting Stripe, Braintree, and Authorize.Net.

## Features

- 🎯 **Multi-Gateway Support**: Stripe, Braintree, and Authorize.Net
- ⚛️ **React/NextJS Optimized**: Built specifically for React applications
- 🔒 **Type Safe**: Full TypeScript support
- 🎨 **Customizable UI**: Tailwind CSS styled components
- 🔄 **State Management**: Zustand-powered payment state
- 🌍 **Environment Aware**: Development and production modes
- 📦 **Easy Integration**: Simple setup and configuration

## Installation

```bash
npm install @your-company/universal-payments-nextjs
```

## Quick Start

### 1. Basic Setup

```tsx
import { PaymentProcessor } from '@your-company/universal-payments-nextjs';

function CheckoutPage() {
  const gatewayConfig = {
    gatewayName: 'stripe', // or 'braintree', 'authorize.net'
    apiBaseUrl: 'https://your-api.com',
    environment: 'development'
  };

  const handlePaymentSuccess = (paymentMethodId: string, details?: any) => {
    console.log('Payment successful:', paymentMethodId);
    // Handle successful payment
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    // Handle payment error
  };

  return (
    <PaymentProcessor
      gatewayConfig={gatewayConfig}
      amount={99.99}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
    />
  );
}
```

### 2. Individual Gateway Components

#### Stripe Checkout
```tsx
import { StripeCheckout } from '@your-company/universal-payments-nextjs';

<StripeCheckout
  apiBaseUrl="https://your-api.com"
  amount={99.99}
  onPaymentSuccess={handleStripeSuccess}
  onPaymentError={handleError}
/>
```

#### Braintree Drop-in
```tsx
import { BraintreeDropIn } from '@your-company/universal-payments-nextjs';

<BraintreeDropIn
  apiBaseUrl="https://your-api.com"
  amount={99.99}
  onPaymentMethodCreated={handleBraintreeSuccess}
  onError={handleError}
/>
```

#### Authorize.Net Form
```tsx
import { AuthorizeNetForm } from '@your-company/universal-payments-nextjs';

<AuthorizeNetForm
  apiBaseUrl="https://your-api.com"
  amount={99.99}
  onPaymentMethodCreated={handleAuthorizeNetSuccess}
  onError={handleError}
/>
```

### 3. State Management

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

  // Your component logic
}
```

## Configuration

### Gateway Configuration

Each gateway requires specific configuration:

```tsx
// Stripe
const stripeConfig = {
  gatewayName: 'stripe',
  apiBaseUrl: 'https://your-api.com',
  environment: 'development' // or 'production'
};

// Braintree
const braintreeConfig = {
  gatewayName: 'braintree',
  apiBaseUrl: 'https://your-api.com',
  environment: 'development'
};

// Authorize.Net
const authorizeNetConfig = {
  gatewayName: 'authorize.net',
  apiBaseUrl: 'https://your-api.com',
  environment: 'development'
};
```

### Backend Requirements

Your backend API should provide the following endpoints:

#### Stripe
- `POST /stripe/createCheckoutSession` - Create checkout session
- `GET /stripe/retrieve-session/:sessionId` - Retrieve session details

#### Braintree
- `GET /braintree/token` - Get client token

#### Authorize.Net
- `GET /authorize-net/credentials` - Get API credentials

## TypeScript Support

The package includes comprehensive TypeScript definitions:

```tsx
import type {
  PaymentProvider,
  PaymentMethodData,
  PaymentProcessingResult,
  PaymentGatewayConfig
} from '@your-company/universal-payments-nextjs';
```

## Styling

Components use Tailwind CSS classes. Ensure Tailwind is configured in your project:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./node_modules/@your-company/universal-payments-nextjs/dist/**/*.{js,ts,jsx,tsx}",
    // ... your other content paths
  ],
  // ... rest of your config
}
```

## Development Mode

The package automatically detects development environments and provides:
- Mock payment processing
- Development-specific UI indicators
- Console debugging information

## Migration from Existing Implementation

If migrating from a custom implementation:

1. Install the package
2. Replace existing payment components with package components
3. Update import statements
4. Configure gateway settings
5. Test payment flows

## Support

For issues and feature requests, please use the GitHub repository issues section.

## License

Private - Company Use Only