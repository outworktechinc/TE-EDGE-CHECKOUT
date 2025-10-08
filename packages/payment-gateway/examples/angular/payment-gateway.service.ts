/**
 * Payment Gateway Service for Angular
 * Use this service in your components
 */

import { Injectable } from '@angular/core';
import {
  PaymentGatewayManager,
  GatewayName,
  CardInput,
  TokenResult
} from '@your-org/payment-gateway';
import { PaymentAdapterService } from './payment-adapter.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentGatewayService {
  private manager: PaymentGatewayManager;

  constructor(private adapter: PaymentAdapterService) {
    this.manager = new PaymentGatewayManager(adapter);
  }

  /**
   * Set the active payment gateway
   */
  setActiveGateway(gateway: GatewayName): void {
    this.manager.setActiveGateway(gateway);
  }

  /**
   * Get the current active gateway
   */
  getActiveGateway(): GatewayName | null {
    return this.manager.getActiveGateway();
  }

  /**
   * Create a payment token from card details
   */
  async createPaymentToken(card: CardInput, gateway: GatewayName): Promise<TokenResult> {
    return this.manager.createPaymentToken(card, gateway);
  }

  /**
   * Check if a gateway is ready
   */
  isGatewayReady(gateway: GatewayName): boolean {
    return this.manager.isGatewayReady(gateway);
  }

  /**
   * Clear payment context (call on logout)
   */
  async clearPaymentContext(): Promise<void> {
    return this.manager.clearPaymentContext();
  }
}
