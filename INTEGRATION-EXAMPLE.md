# Integration Example

Here's how to integrate the Universal Payments package into your existing Ombee Mobile project:

## 1. Install the Package

After publishing to GitHub Packages:

```bash
npm install @your-company/universal-payments-nextjs
```

## 2. Replace Existing Components

### Before (Current Implementation)
```tsx
// src/components/features/payment/PaymentProcessor.tsx
import React, { useState } from 'react';
import { useCheckout } from '@/hooks/useAppData';
import BraintreeDropIn from './BraintreeDropIn';
import AuthorizeNetForm from './AuthorizeNetForm';
import StripeCheckout from './StripeCheckout';

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ ... }) => {
  // Your existing implementation
};
```

### After (Using Package)
```tsx
// src/components/features/payment/PaymentProcessor.tsx
import React from 'react';
import { PaymentProcessor } from '@your-company/universal-payments-nextjs';
import { useCheckout } from '@/hooks/useAppData';

interface PaymentProcessorWrapperProps {
  onPaymentSuccess: (paymentMethodId: string, details?: any) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  isProcessing?: boolean;
}

const PaymentProcessorWrapper: React.FC<PaymentProcessorWrapperProps> = (props) => {
  const { subscriptionData } = useCheckout();

  const gatewayConfig = {
    gatewayName: subscriptionData?.gatewayName || 'stripe',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    environment: process.env.NODE_ENV as 'development' | 'production'
  };

  return (
    <PaymentProcessor
      {...props}
      gatewayConfig={gatewayConfig}
    />
  );
};

export default PaymentProcessorWrapper;
```

## 3. Update Page Components

### Before
```tsx
// src/app/plans/payment/page.tsx
import PaymentProcessor from '@/components/features/payment/PaymentProcessor';
```

### After
```tsx
// src/app/plans/payment/page.tsx
import PaymentProcessorWrapper from '@/components/features/payment/PaymentProcessor';

// Use PaymentProcessorWrapper instead of PaymentProcessor
```

## 4. Update State Management

### Before
```tsx
import { usePaymentMethodStore } from '@/stores/usePaymentMethodStore';
```

### After
```tsx
import { usePaymentMethodStore } from '@your-company/universal-payments-nextjs';
```

## 5. Environment Variables

Ensure your `.env.local` includes:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
# or your production API URL
```

## 6. Tailwind Configuration

Update your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@your-company/universal-payments-nextjs/dist/**/*.{js,ts,jsx,tsx}",
  ],
  // ... rest of your config
}
```

## 7. Migration Checklist

- [ ] Install the package
- [ ] Update imports in payment-related files
- [ ] Replace PaymentProcessor component usage
- [ ] Update Tailwind config
- [ ] Test all payment flows (Stripe, Braintree, Authorize.Net)
- [ ] Remove old payment component files
- [ ] Update any type imports
- [ ] Test in development and staging environments

## 8. Benefits After Migration

✅ **Reusability**: Use same payment logic across all 4 applications
✅ **Maintainability**: Single source of truth for payment implementations
✅ **Version Control**: Controlled updates via package versioning
✅ **TypeScript**: Full type safety maintained
✅ **Testing**: Centralized testing for payment logic
✅ **Documentation**: Package-level documentation and examples

## 9. Rollback Plan

If issues arise during migration:

1. Keep old components as backup (`*.old.tsx`)
2. Revert imports to original files
3. Remove package dependency
4. Test original functionality

The package is designed to be a drop-in replacement with minimal changes required.