/**
 * Universal Payment Configuration
 * Environment-agnostic configuration management
 */

import { PaymentErrorCode, createPaymentError } from './errors';

export type Environment = 'development' | 'staging' | 'production';
export type PaymentGateway = 'stripe' | 'braintree' | 'authorize.net';

/**
 * Base configuration interface
 */
export interface BasePaymentConfig {
  environment: Environment;
  apiBaseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Stripe-specific configuration
 */
export interface StripeConfig extends BasePaymentConfig {
  gateway: 'stripe';
  publishableKey?: string;
  webhookSecret?: string;
  apiVersion?: string;
}

/**
 * Braintree-specific configuration
 */
export interface BraintreeConfig extends BasePaymentConfig {
  gateway: 'braintree';
  environment: Environment;
  merchantId?: string;
  publicKey?: string;
  privateKey?: string;
}

/**
 * Authorize.Net-specific configuration
 */
export interface AuthorizeNetConfig extends BasePaymentConfig {
  gateway: 'authorize.net';
  apiLoginId?: string;
  transactionKey?: string;
  clientKey?: string;
  endpoint?: string;
}

/**
 * Union type for all gateway configurations
 */
export type PaymentConfig = StripeConfig | BraintreeConfig | AuthorizeNetConfig;

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<BasePaymentConfig> = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  enableLogging: true,
  logLevel: 'info'
};

/**
 * Configuration Builder Class
 */
export class PaymentConfigBuilder {
  private config: Partial<PaymentConfig> = {};

  /**
   * Set the payment gateway
   */
  gateway(gateway: PaymentGateway): PaymentConfigBuilder {
    this.config.gateway = gateway;
    return this;
  }

  /**
   * Set the environment
   */
  environment(env: Environment): PaymentConfigBuilder {
    this.config.environment = env;
    return this;
  }

  /**
   * Set the API base URL
   */
  apiBaseUrl(url: string): PaymentConfigBuilder {
    this.config.apiBaseUrl = url;
    return this;
  }

  /**
   * Set request timeout
   */
  timeout(ms: number): PaymentConfigBuilder {
    this.config.timeout = ms;
    return this;
  }

  /**
   * Set retry attempts
   */
  retries(attempts: number): PaymentConfigBuilder {
    this.config.retryAttempts = attempts;
    return this;
  }

  /**
   * Enable/disable logging
   */
  logging(enabled: boolean, level?: 'error' | 'warn' | 'info' | 'debug'): PaymentConfigBuilder {
    this.config.enableLogging = enabled;
    if (level) {
      this.config.logLevel = level;
    }
    return this;
  }

  /**
   * Set Stripe-specific configuration
   */
  stripe(options: {
    publishableKey?: string;
    webhookSecret?: string;
    apiVersion?: string;
  }): PaymentConfigBuilder {
    if (this.config.gateway !== 'stripe') {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Stripe configuration can only be set for Stripe gateway'
      );
    }
    Object.assign(this.config, options);
    return this;
  }

  /**
   * Set Braintree-specific configuration
   */
  braintree(options: {
    merchantId?: string;
    publicKey?: string;
    privateKey?: string;
  }): PaymentConfigBuilder {
    if (this.config.gateway !== 'braintree') {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Braintree configuration can only be set for Braintree gateway'
      );
    }
    Object.assign(this.config, options);
    return this;
  }

  /**
   * Set Authorize.Net-specific configuration
   */
  authorizeNet(options: {
    apiLoginId?: string;
    transactionKey?: string;
    clientKey?: string;
    endpoint?: string;
  }): PaymentConfigBuilder {
    if (this.config.gateway !== 'authorize.net') {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Authorize.Net configuration can only be set for Authorize.Net gateway'
      );
    }
    Object.assign(this.config, options);
    return this;
  }

  /**
   * Build and validate the configuration
   */
  build(): PaymentConfig {
    const finalConfig = { ...DEFAULT_CONFIG, ...this.config } as PaymentConfig;

    // Validate required fields
    this.validateConfig(finalConfig);

    return finalConfig;
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: PaymentConfig): void {
    if (!config.gateway) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Payment gateway is required'
      );
    }

    if (!config.environment) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Environment is required'
      );
    }

    if (!config.apiBaseUrl) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'API base URL is required'
      );
    }

    // Validate URL format
    try {
      new URL(config.apiBaseUrl);
    } catch {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Invalid API base URL format'
      );
    }

    // Gateway-specific validation
    switch (config.gateway) {
      case 'stripe':
        this.validateStripeConfig(config as StripeConfig);
        break;
      case 'braintree':
        this.validateBraintreeConfig(config as BraintreeConfig);
        break;
      case 'authorize.net':
        this.validateAuthorizeNetConfig(config as AuthorizeNetConfig);
        break;
    }
  }

  private validateStripeConfig(config: StripeConfig): void {
    // Add Stripe-specific validation if needed
    if (config.environment === 'production' && config.publishableKey?.includes('pk_test')) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Test publishable key cannot be used in production environment'
      );
    }
  }

  private validateBraintreeConfig(config: BraintreeConfig): void {
    // Add Braintree-specific validation if needed
  }

  private validateAuthorizeNetConfig(config: AuthorizeNetConfig): void {
    // Add Authorize.Net-specific validation if needed
  }
}

/**
 * Environment Configuration Helper
 */
export class EnvironmentConfigHelper {
  /**
   * Create configuration from environment variables
   */
  static fromEnvironment(gateway: PaymentGateway): PaymentConfig {
    const builder = new PaymentConfigBuilder()
      .gateway(gateway)
      .environment((process.env.NODE_ENV as Environment) || 'development')
      .apiBaseUrl(process.env.PAYMENT_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '');

    // Set logging based on environment
    const isDev = process.env.NODE_ENV === 'development';
    builder.logging(isDev, isDev ? 'debug' : 'error');

    // Gateway-specific environment variables
    switch (gateway) {
      case 'stripe':
        builder.stripe({
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          apiVersion: process.env.STRIPE_API_VERSION
        });
        break;

      case 'braintree':
        builder.braintree({
          merchantId: process.env.BRAINTREE_MERCHANT_ID,
          publicKey: process.env.BRAINTREE_PUBLIC_KEY,
          privateKey: process.env.BRAINTREE_PRIVATE_KEY
        });
        break;

      case 'authorize.net':
        builder.authorizeNet({
          apiLoginId: process.env.AUTHORIZE_NET_API_LOGIN_ID,
          transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY,
          clientKey: process.env.AUTHORIZE_NET_CLIENT_KEY,
          endpoint: process.env.AUTHORIZE_NET_ENDPOINT
        });
        break;
    }

    return builder.build();
  }

  /**
   * Get required environment variables for a gateway
   */
  static getRequiredEnvVars(gateway: PaymentGateway): string[] {
    const base = ['NODE_ENV', 'PAYMENT_API_BASE_URL'];

    switch (gateway) {
      case 'stripe':
        return [...base, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'];
      case 'braintree':
        return [...base, 'BRAINTREE_MERCHANT_ID', 'BRAINTREE_PUBLIC_KEY'];
      case 'authorize.net':
        return [...base, 'AUTHORIZE_NET_API_LOGIN_ID', 'AUTHORIZE_NET_CLIENT_KEY'];
      default:
        return base;
    }
  }

  /**
   * Check if all required environment variables are set
   */
  static validateEnvironment(gateway: PaymentGateway): { valid: boolean; missing: string[] } {
    const required = this.getRequiredEnvVars(gateway);
    const missing: string[] = [];

    for (const envVar of required) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

/**
 * Convenience functions for creating configurations
 */
export const createStripeConfig = (options: Partial<StripeConfig>): StripeConfig => {
  return new PaymentConfigBuilder()
    .gateway('stripe')
    .environment(options.environment || 'development')
    .apiBaseUrl(options.apiBaseUrl || '')
    .stripe({
      publishableKey: options.publishableKey,
      webhookSecret: options.webhookSecret,
      apiVersion: options.apiVersion
    })
    .build() as StripeConfig;
};

export const createBraintreeConfig = (options: Partial<BraintreeConfig>): BraintreeConfig => {
  return new PaymentConfigBuilder()
    .gateway('braintree')
    .environment(options.environment || 'development')
    .apiBaseUrl(options.apiBaseUrl || '')
    .braintree({
      merchantId: options.merchantId,
      publicKey: options.publicKey,
      privateKey: options.privateKey
    })
    .build() as BraintreeConfig;
};

export const createAuthorizeNetConfig = (options: Partial<AuthorizeNetConfig>): AuthorizeNetConfig => {
  return new PaymentConfigBuilder()
    .gateway('authorize.net')
    .environment(options.environment || 'development')
    .apiBaseUrl(options.apiBaseUrl || '')
    .authorizeNet({
      apiLoginId: options.apiLoginId,
      transactionKey: options.transactionKey,
      clientKey: options.clientKey,
      endpoint: options.endpoint
    })
    .build() as AuthorizeNetConfig;
};