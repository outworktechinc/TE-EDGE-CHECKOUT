/**
 * Example Payment Form Component for Next.js
 */

'use client';

import { useState } from 'react';
import { paymentGateway } from './payment-gateway';
import { PaymentError } from '@your-org/payment-gateway';

export default function PaymentForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Set the active gateway (could come from user selection or API)
      paymentGateway.setActiveGateway('Stripe');

      // Create payment token
      const { token, gatewayName } = await paymentGateway.createPaymentToken(
        cardDetails,
        'Stripe'
      );

      console.log('Payment token created:', token);
      console.log('Gateway used:', gatewayName);

      // Send token to your backend for processing
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentToken: token,
          gateway: gatewayName,
          amount: 1000 // amount in cents
        })
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      alert('Payment successful!');
    } catch (err) {
      if (err instanceof PaymentError) {
        setError(`Payment error: ${err.message}`);
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Payment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cardNumber">Card Number</label>
        <input
          id="cardNumber"
          type="text"
          value={cardDetails.number}
          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
          placeholder="4111111111111111"
          required
        />
      </div>

      <div className="flex gap-4">
        <div>
          <label htmlFor="expMonth">Month</label>
          <input
            id="expMonth"
            type="text"
            value={cardDetails.expMonth}
            onChange={(e) => setCardDetails({ ...cardDetails, expMonth: e.target.value })}
            placeholder="12"
            maxLength={2}
            required
          />
        </div>

        <div>
          <label htmlFor="expYear">Year</label>
          <input
            id="expYear"
            type="text"
            value={cardDetails.expYear}
            onChange={(e) => setCardDetails({ ...cardDetails, expYear: e.target.value })}
            placeholder="2025"
            maxLength={4}
            required
          />
        </div>

        <div>
          <label htmlFor="cvc">CVC</label>
          <input
            id="cvc"
            type="text"
            value={cardDetails.cvc}
            onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
