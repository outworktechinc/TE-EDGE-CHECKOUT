/**
 * Authorize.Net Payment Gateway Integration
 * Framework-agnostic implementation
 */

import {
  CardInput,
  PaymentError,
  PaymentErrorCode,
  AuthNetAuthData,
  AuthNetCardData,
  AuthNetResponse,
  EnvironmentAdapter
} from "../types";
import { loadScript } from "../utils";

const AUTHNET_ACCEPT_JS_URL = "https://js.authorize.net/v3/Accept.js";

let acceptJsReady = false;
let acceptJsReadyPromise: Promise<void> | null = null;

/**
 * Get Authorize.Net credentials from configuration
 */
function getAuthNetAuthData(adapter: EnvironmentAdapter): AuthNetAuthData {
  const clientKey = adapter.getConfig("authorizeNetClientKey");
  const apiLoginID = adapter.getConfig("authorizeNetApiLoginId");

  if (!clientKey || !apiLoginID) {
    throw new PaymentError(
      PaymentErrorCode.CONFIG_MISSING,
      "Missing Authorize.Net configuration: authorizeNetClientKey and authorizeNetApiLoginId required"
    );
  }

  return {
    clientKey,
    apiLoginID
  };
}

/**
 * Initialize Authorize.Net Accept.js SDK
 */
export async function initializeAuthorizeNet(adapter: EnvironmentAdapter): Promise<void> {
  if (!adapter.isBrowser()) {
    throw new PaymentError(
      PaymentErrorCode.SDK_LOAD_FAILED,
      "Cannot initialize Authorize.Net in server environment"
    );
  }

  if (acceptJsReady && window.Accept) {
    console.debug("[Authorize.Net] Already initialized");
    return;
  }

  if (acceptJsReadyPromise) {
    console.debug("[Authorize.Net] Already initializing, waiting...");
    return acceptJsReadyPromise;
  }

  acceptJsReadyPromise = (async () => {
    try {
      console.debug("[Authorize.Net] Starting initialization...");

      await loadScript(AUTHNET_ACCEPT_JS_URL, adapter);

      if (!window.Accept) {
        throw new PaymentError(
          PaymentErrorCode.SDK_LOAD_FAILED,
          "Accept.js loaded but window.Accept is undefined"
        );
      }

      getAuthNetAuthData(adapter);

      acceptJsReady = true;
      console.debug("[Authorize.Net] Initialization complete");
    } catch (error) {
      acceptJsReadyPromise = null;

      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        PaymentErrorCode.SDK_LOAD_FAILED,
        "Failed to initialize Authorize.Net SDK",
        error
      );
    }
  })();

  return acceptJsReadyPromise;
}

/**
 * Create payment nonce from card details
 */
export async function createAuthorizeNetToken(
  card: CardInput,
  adapter: EnvironmentAdapter
): Promise<string> {
  if (!acceptJsReady || !window.Accept) {
    throw new PaymentError(
      PaymentErrorCode.NOT_READY,
      "Authorize.Net SDK not initialized. Call initializeAuthorizeNet() first."
    );
  }

  return new Promise((resolve, reject) => {
    try {
      console.debug("[Authorize.Net] Creating payment nonce...");

      const authData = getAuthNetAuthData(adapter);

      const cardData: AuthNetCardData = {
        cardNumber: card.number.replace(/\s/g, ""),
        month: card.expMonth.padStart(2, "0"),
        year: card.expYear,
        cardCode: card.cvc
      };

      window.Accept!.dispatchData(
        {
          authData,
          cardData
        },
        (response: AuthNetResponse) => {
          if (response.messages.resultCode === "Error") {
            const errorMsg =
              response.messages.message[0]?.text ||
              "Unknown error from Authorize.Net";

            reject(
              new PaymentError(
                PaymentErrorCode.INVALID_CARD,
                errorMsg,
                { response }
              )
            );
            return;
          }

          if (!response.opaqueData?.dataValue) {
            reject(
              new PaymentError(
                PaymentErrorCode.TOKENIZATION_FAILED,
                "Authorize.Net returned no opaque data value",
                { response }
              )
            );
            return;
          }

          const token = response.opaqueData.dataValue;
          console.debug(
            `[Authorize.Net] Payment nonce created: ${token.substring(0, 20)}...`
          );

          resolve(token);
        }
      );
    } catch (error) {
      if (error instanceof PaymentError) {
        reject(error);
        return;
      }

      reject(
        new PaymentError(
          PaymentErrorCode.TOKENIZATION_FAILED,
          "Failed to create Authorize.Net payment nonce",
          error
        )
      );
    }
  });
}

/**
 * Reset Authorize.Net state
 */
export function resetAuthorizeNet(): void {
  acceptJsReady = false;
  acceptJsReadyPromise = null;
  console.debug("[Authorize.Net] Reset complete");
}

/**
 * Check if Authorize.Net is ready
 */
export function isAuthorizeNetReady(): boolean {
  return acceptJsReady && typeof window !== "undefined" && !!window.Accept;
}
