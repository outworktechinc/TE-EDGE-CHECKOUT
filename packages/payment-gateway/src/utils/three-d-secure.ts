/**
 * 3D Secure (SCA) Support
 * Handles Strong Customer Authentication for payments
 */

import { EnvironmentAdapter } from '../types';

export enum ThreeDSStatus {
  NOT_REQUIRED = 'not_required',
  REQUIRES_ACTION = 'requires_action',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  PENDING = 'pending'
}

export interface ThreeDSResult {
  status: ThreeDSStatus;
  requiresAction: boolean;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
}

export interface ThreeDSOptions {
  returnUrl?: string;
  challengeWindowSize?: '01' | '02' | '03' | '04' | '05';
}

/**
 * Handle Stripe 3D Secure authentication
 */
export async function handleStripe3DS(
  paymentIntentClientSecret: string,
  stripe: any,
  _options: ThreeDSOptions = {}
): Promise<ThreeDSResult> {
  try {
    // Confirm the payment with 3DS if required
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      paymentIntentClientSecret,
      {
        return_url: _options.returnUrl
      }
    );

    if (error) {
      return {
        status: ThreeDSStatus.FAILED,
        requiresAction: false,
        error: error.message
      };
    }

    if (paymentIntent.status === 'requires_action') {
      // 3DS authentication required
      return {
        status: ThreeDSStatus.REQUIRES_ACTION,
        requiresAction: true,
        clientSecret: paymentIntentClientSecret
      };
    }

    if (paymentIntent.status === 'succeeded') {
      return {
        status: ThreeDSStatus.SUCCEEDED,
        requiresAction: false
      };
    }

    if (paymentIntent.status === 'processing') {
      return {
        status: ThreeDSStatus.PENDING,
        requiresAction: false
      };
    }

    return {
      status: ThreeDSStatus.FAILED,
      requiresAction: false,
      error: 'Payment failed'
    };
  } catch (error) {
    console.error('[3DS] Stripe 3DS error:', error);
    return {
      status: ThreeDSStatus.FAILED,
      requiresAction: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle Braintree 3D Secure authentication
 */
export async function handleBraintree3DS(
  nonce: string,
  amount: number,
  braintreeClient: any,
  _options: ThreeDSOptions = {}
): Promise<ThreeDSResult> {
  try {
    // Load 3DS module
    const threeDSecure = await (window as any).braintree.threeDSecure.create({
      client: braintreeClient,
      version: 2 // Use 3DS 2.0
    });

    // Verify the card with 3DS
    const result = await threeDSecure.verifyCard({
      nonce,
      amount: amount.toString(),
      bin: '', // Card BIN (first 6 digits) - optional
      challengeRequested: true,
      onLookupComplete: (_data: any, next: () => void) => {
        // Called when the lookup completes
        next();
      }
    });

    if (result.liabilityShifted) {
      // 3DS authentication successful
      return {
        status: ThreeDSStatus.SUCCEEDED,
        requiresAction: false
      };
    }

    if (result.liabilityShiftPossible && !result.liabilityShifted) {
      // 3DS authentication failed or not completed
      return {
        status: ThreeDSStatus.FAILED,
        requiresAction: false,
        error: '3D Secure authentication failed'
      };
    }

    // 3DS not available for this card
    return {
      status: ThreeDSStatus.NOT_REQUIRED,
      requiresAction: false
    };
  } catch (error) {
    console.error('[3DS] Braintree 3DS error:', error);
    return {
      status: ThreeDSStatus.FAILED,
      requiresAction: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle Authorize.Net Cardinal Commerce 3DS
 * (Authorize.Net uses Cardinal Commerce for 3DS)
 */
export async function handleAuthorizeNet3DS(
  transactionId: string,
  adapter: EnvironmentAdapter,
  _options: ThreeDSOptions = {}
): Promise<ThreeDSResult> {
  try {
    // Check 3DS status from backend
    const apiBaseUrl = adapter.getConfig('apiBaseUrl') || '';
    const response = await adapter.fetch(`${apiBaseUrl}/api/payments/authorizenet/3ds/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: ThreeDSStatus.FAILED,
        requiresAction: false,
        error: data.error || '3DS verification failed'
      };
    }

    // Map Authorize.Net status to our enum
    switch (data.status) {
      case 'authenticated':
        return {
          status: ThreeDSStatus.SUCCEEDED,
          requiresAction: false
        };

      case 'requires_challenge':
        return {
          status: ThreeDSStatus.REQUIRES_ACTION,
          requiresAction: true,
          redirectUrl: data.challengeUrl
        };

      case 'pending':
        return {
          status: ThreeDSStatus.PENDING,
          requiresAction: false
        };

      default:
        return {
          status: ThreeDSStatus.NOT_REQUIRED,
          requiresAction: false
        };
    }
  } catch (error) {
    console.error('[3DS] Authorize.Net 3DS error:', error);
    return {
      status: ThreeDSStatus.FAILED,
      requiresAction: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if 3DS is required for the transaction
 */
export function is3DSRequired(amount: number, country: string): boolean {
  // SCA is required in EEA for transactions above €30
  const eeaCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO'
  ];

  if (eeaCountries.includes(country.toUpperCase())) {
    // Amount in EUR cents, threshold is €30 = 3000 cents
    return amount >= 3000;
  }

  // UK also requires SCA
  if (country.toUpperCase() === 'GB') {
    // Amount in GBP pence, threshold is £30 = 3000 pence
    return amount >= 3000;
  }

  // For other countries, 3DS is optional but recommended
  return false;
}

/**
 * Get challenge window size based on device
 */
export function getChallengeWindowSize(): '01' | '02' | '03' | '04' | '05' {
  if (typeof window === 'undefined') {
    return '02'; // Default to 390x400
  }

  const width = window.innerWidth;

  // 01 = 250x400
  if (width <= 300) {
    return '01';
  }

  // 02 = 390x400
  if (width <= 450) {
    return '02';
  }

  // 03 = 500x600
  if (width <= 600) {
    return '03';
  }

  // 04 = 600x400
  if (width <= 750) {
    return '04';
  }

  // 05 = Full screen
  return '05';
}

/**
 * Format 3DS error for display
 */
export function format3DSError(result: ThreeDSResult): string {
  if (result.status === ThreeDSStatus.SUCCEEDED) {
    return 'Authentication successful';
  }

  if (result.status === ThreeDSStatus.FAILED) {
    return result.error || '3D Secure authentication failed. Please try a different card.';
  }

  if (result.status === ThreeDSStatus.REQUIRES_ACTION) {
    return 'Additional authentication required';
  }

  if (result.status === ThreeDSStatus.PENDING) {
    return 'Authentication pending...';
  }

  return 'Authentication not required';
}
