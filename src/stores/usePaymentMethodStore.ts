/**
 * Universal Payment Method Store
 * Extracted and adapted from Ombee Mobile usePaymentMethodStore.ts
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PaymentProvider, PaymentMethodData } from '../types/payment';

export interface PaymentMethodState {
  // Selected payment method
  selectedPaymentMethod: PaymentMethodData | null;

  // Available payment methods
  availablePaymentMethods: PaymentMethodData[];

  // Payment processing states
  isProcessingPayment: boolean;
  isCreatingPaymentMethod: boolean;

  // Error states
  paymentError: string | null;

  // Actions
  setSelectedPaymentMethod: (method: PaymentMethodData | null) => void;
  addPaymentMethod: (method: PaymentMethodData) => void;
  removePaymentMethod: (methodId: string) => void;
  clearPaymentMethods: () => void;
  setProcessingPayment: (isProcessing: boolean) => void;
  setCreatingPaymentMethod: (isCreating: boolean) => void;
  setPaymentError: (error: string | null) => void;
  clearPaymentError: () => void;

  // Nonce management
  createStripePaymentMethod: (stripe: any, card: any) => Promise<PaymentMethodData | null>;
  createBraintreePaymentMethod: (dropinInstance: any) => Promise<PaymentMethodData | null>;
  createAuthorizeNetPaymentMethod: (opaqueData: string) => Promise<PaymentMethodData | null>;
}

const usePaymentMethodStore = create<PaymentMethodState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedPaymentMethod: null,
      availablePaymentMethods: [],
      isProcessingPayment: false,
      isCreatingPaymentMethod: false,
      paymentError: null,

      // Actions
      setSelectedPaymentMethod: (method) => {
        set({ selectedPaymentMethod: method });
      },

      addPaymentMethod: (method) => {
        set((state) => {
          // Remove any existing default if this is being set as default
          const updatedMethods = state.availablePaymentMethods.map(m =>
            method.isDefault ? { ...m, isDefault: false } : m
          );

          return {
            availablePaymentMethods: [...updatedMethods, method],
            selectedPaymentMethod: method.isDefault ? method : state.selectedPaymentMethod
          };
        });
      },

      removePaymentMethod: (methodId) => {
        set((state) => {
          const filteredMethods = state.availablePaymentMethods.filter(m => m.id !== methodId);
          const selectedMethodRemoved = state.selectedPaymentMethod?.id === methodId;

          return {
            availablePaymentMethods: filteredMethods,
            selectedPaymentMethod: selectedMethodRemoved ? null : state.selectedPaymentMethod
          };
        });
      },

      clearPaymentMethods: () => {
        set({
          availablePaymentMethods: [],
          selectedPaymentMethod: null
        });
      },

      setProcessingPayment: (isProcessing) => {
        set({ isProcessingPayment: isProcessing });
      },

      setCreatingPaymentMethod: (isCreating) => {
        set({ isCreatingPaymentMethod: isCreating });
      },

      setPaymentError: (error) => {
        set({ paymentError: error });
      },

      clearPaymentError: () => {
        set({ paymentError: null });
      },

      // Stripe payment method creation
      createStripePaymentMethod: async (stripe, card) => {
        const { setCreatingPaymentMethod, setPaymentError, addPaymentMethod } = get();

        try {
          setCreatingPaymentMethod(true);
          setPaymentError(null);

          const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: card,
          });

          if (error) {
            setPaymentError(error.message);
            return null;
          }

          const paymentMethodData: PaymentMethodData = {
            id: paymentMethod.id,
            provider: 'stripe',
            nonce: paymentMethod.id,
            last4: paymentMethod.card?.last4,
            brand: paymentMethod.card?.brand,
            expiryMonth: paymentMethod.card?.exp_month?.toString(),
            expiryYear: paymentMethod.card?.exp_year?.toString(),
            isDefault: true,
            createdAt: new Date()
          };

          addPaymentMethod(paymentMethodData);
          return paymentMethodData;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create Stripe payment method';
          setPaymentError(errorMessage);
          return null;
        } finally {
          setCreatingPaymentMethod(false);
        }
      },

      // Braintree payment method creation
      createBraintreePaymentMethod: async (dropinInstance) => {
        const { setCreatingPaymentMethod, setPaymentError, addPaymentMethod } = get();

        try {
          setCreatingPaymentMethod(true);
          setPaymentError(null);

          return new Promise((resolve) => {
            dropinInstance.requestPaymentMethod((error: any, payload: any) => {
              if (error) {
                setPaymentError(error.message);
                setCreatingPaymentMethod(false);
                resolve(null);
                return;
              }

              const paymentMethodData: PaymentMethodData = {
                id: `braintree_${Date.now()}`,
                provider: 'braintree',
                nonce: payload.nonce,
                last4: payload.details?.lastFour,
                brand: payload.details?.cardType,
                isDefault: true,
                createdAt: new Date()
              };

              addPaymentMethod(paymentMethodData);
              setCreatingPaymentMethod(false);
              resolve(paymentMethodData);
            });
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create Braintree payment method';
          setPaymentError(errorMessage);
          setCreatingPaymentMethod(false);
          return null;
        }
      },

      // Authorize.Net payment method creation
      createAuthorizeNetPaymentMethod: async (opaqueData) => {
        const { setCreatingPaymentMethod, setPaymentError, addPaymentMethod } = get();

        try {
          setCreatingPaymentMethod(true);
          setPaymentError(null);

          const paymentMethodData: PaymentMethodData = {
            id: `authorize_net_${Date.now()}`,
            provider: 'authorize_net',
            nonce: opaqueData,
            isDefault: true,
            createdAt: new Date()
          };

          addPaymentMethod(paymentMethodData);
          return paymentMethodData;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create Authorize.Net payment method';
          setPaymentError(errorMessage);
          return null;
        } finally {
          setCreatingPaymentMethod(false);
        }
      },
    }),
    {
      name: 'universal-payment-method-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedPaymentMethod: state.selectedPaymentMethod,
        availablePaymentMethods: state.availablePaymentMethods,
      }),
    }
  )
);

export { usePaymentMethodStore };

// Selector hooks for optimized re-renders
export const useSelectedPaymentMethod = () => usePaymentMethodStore((state) => state.selectedPaymentMethod);
export const useAvailablePaymentMethods = () => usePaymentMethodStore((state) => state.availablePaymentMethods);
export const usePaymentProcessingState = () => usePaymentMethodStore((state) => ({
  isProcessingPayment: state.isProcessingPayment,
  isCreatingPaymentMethod: state.isCreatingPaymentMethod
}));
export const usePaymentError = () => usePaymentMethodStore((state) => state.paymentError);