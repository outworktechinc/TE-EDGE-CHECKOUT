/**
 * Payment Method Icons
 * SVG icons for card brands and payment methods
 */
import { CardBrand } from './card-validation';
/**
 * Card brand icons as data URIs
 * These are embedded SVGs for better performance and offline support
 */
export declare const CARD_ICONS: Record<CardBrand, string>;
/**
 * Get card icon data URI
 */
export declare function getCardIcon(cardBrand: CardBrand): string;
/**
 * Gateway icons
 */
export declare const GATEWAY_ICONS: {
    stripe: string;
    braintree: string;
    authorizenet: string;
};
/**
 * Get gateway icon
 */
export declare function getGatewayIcon(gateway: string): string;
/**
 * Preload card icons
 * Useful for improving perceived performance
 */
export declare function preloadCardIcons(): void;
/**
 * Get card icon as Image element
 */
export declare function createCardIconElement(cardBrand: CardBrand, options?: {
    width?: number;
    height?: number;
    className?: string;
    alt?: string;
}): HTMLImageElement | null;
//# sourceMappingURL=card-icons.d.ts.map