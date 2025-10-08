# Getting Started

## What is this library?

This is a **framework-agnostic** payment gateway integration library that works with:
- ✅ Next.js
- ✅ Angular
- ✅ React
- ✅ Vue
- ✅ Any JavaScript/TypeScript framework

It supports **three payment gateways**:
1. **Stripe**
2. **Braintree**
3. **Authorize.Net**

## Why use this library?

✅ **Single source of truth** - Update once, use everywhere
✅ **Type-safe** - Full TypeScript support
✅ **Framework-agnostic** - Works with any framework
✅ **Easy to maintain** - Centralized payment logic
✅ **Secure** - Client-side tokenization only

## Quick Setup

### 1. Install

```bash
npm install @your-org/payment-gateway
```

### 2. Create Adapter

Choose your framework:

**Next.js:**
```typescript
// lib/payment-adapter.ts
import { EnvironmentAdapter, GatewayConfig } from '@your-org/payment-gateway';

const config: GatewayConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  authorizeNetClientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY,
  authorizeNetApiLoginId: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN_ID,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || ''
};

export const adapter: EnvironmentAdapter = {
  getConfig: (key) => config[key],
  isBrowser: () => typeof window !== 'undefined',
  fetch: (url, options) => fetch(url, options)
};
```

**Angular:**
See [examples/angular/payment-adapter.service.ts](./examples/angular/payment-adapter.service.ts)

### 3. Initialize Manager

```typescript
import { PaymentGatewayManager } from '@your-org/payment-gateway';
import { adapter } from './payment-adapter';

export const paymentGateway = new PaymentGatewayManager(adapter);
```

### 4. Use in Your App

```typescript
const { token, gatewayName } = await paymentGateway.createPaymentToken(
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
  body: JSON.stringify({ token, gatewayName })
});
```

## Next Steps

1. **[README.md](./README.md)** - Full API documentation
2. **[INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)** - Detailed integration steps
3. **[examples/](./examples/)** - Complete examples for Next.js and Angular

## File Structure

```
payment-gateway-library/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   └── gateways/             # Gateway implementations
│       ├── stripe.ts
│       ├── braintree.ts
│       └── authorizenet.ts
├── examples/
│   ├── nextjs/               # Next.js examples
│   └── angular/              # Angular examples
├── README.md                 # API documentation
├── INTEGRATION-GUIDE.md      # Step-by-step guide
└── package.json
```

## Support

- 📖 Documentation: See README.md
- 💬 Issues: GitHub Issues
- 📧 Email: support@your-org.com

## License

MIT
