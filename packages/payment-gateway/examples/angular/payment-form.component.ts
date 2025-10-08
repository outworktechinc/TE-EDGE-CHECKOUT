/**
 * Example Payment Form Component for Angular
 */

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentError, GatewayName } from '@your-org/payment-gateway';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment-form',
  template: `
    <form [formGroup]="paymentForm" (ngSubmit)="handleSubmit()" class="payment-form">
      <div class="form-group">
        <label for="cardNumber">Card Number</label>
        <input
          id="cardNumber"
          type="text"
          formControlName="number"
          placeholder="4111111111111111"
          class="form-control"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="expMonth">Month</label>
          <input
            id="expMonth"
            type="text"
            formControlName="expMonth"
            placeholder="12"
            maxlength="2"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="expYear">Year</label>
          <input
            id="expYear"
            type="text"
            formControlName="expYear"
            placeholder="2025"
            maxlength="4"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="cvc">CVC</label>
          <input
            id="cvc"
            type="text"
            formControlName="cvc"
            placeholder="123"
            maxlength="4"
            class="form-control"
          />
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>

      <button
        type="submit"
        [disabled]="loading || paymentForm.invalid"
        class="btn btn-primary"
      >
        {{ loading ? 'Processing...' : 'Pay Now' }}
      </button>
    </form>
  `,
  styles: [`
    .payment-form {
      max-width: 500px;
      margin: 20px auto;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-row {
      display: flex;
      gap: 10px;
    }

    .form-control {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .alert-danger {
      color: #721c24;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
  `]
})
export class PaymentFormComponent {
  paymentForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private paymentGateway: PaymentGatewayService,
    private http: HttpClient
  ) {
    this.paymentForm = this.fb.group({
      number: ['', Validators.required],
      expMonth: ['', [Validators.required, Validators.pattern(/^\d{1,2}$/)]],
      expYear: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });
  }

  async handleSubmit() {
    if (this.paymentForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const cardDetails = this.paymentForm.value;

      // Set the active gateway
      const gateway: GatewayName = 'Stripe';
      this.paymentGateway.setActiveGateway(gateway);

      // Create payment token
      const { token, gatewayName } = await this.paymentGateway.createPaymentToken(
        cardDetails,
        gateway
      );

      console.log('Payment token created:', token);
      console.log('Gateway used:', gatewayName);

      // Send token to backend for processing
      const response = await this.http.post('/api/process-payment', {
        paymentToken: token,
        gateway: gatewayName,
        amount: 1000 // amount in cents
      }).toPromise();

      alert('Payment successful!');
      this.paymentForm.reset();
    } catch (err) {
      if (err instanceof PaymentError) {
        this.error = `Payment error: ${err.message}`;
      } else {
        this.error = 'An unexpected error occurred';
      }
      console.error('Payment failed:', err);
    } finally {
      this.loading = false;
    }
  }
}
