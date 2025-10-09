"use strict";
/**
 * Payment Method Icons
 * SVG icons for card brands and payment methods
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GATEWAY_ICONS = exports.CARD_ICONS = void 0;
exports.getCardIcon = getCardIcon;
exports.getGatewayIcon = getGatewayIcon;
exports.preloadCardIcons = preloadCardIcons;
exports.createCardIconElement = createCardIconElement;
const card_validation_1 = require("./card-validation");
/**
 * Card brand icons as data URIs
 * These are embedded SVGs for better performance and offline support
 */
exports.CARD_ICONS = {
    visa: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA0MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iIzE0MzQ4RSIvPgo8cGF0aCBkPSJNMTYuNzQgMTguNEgxNC4yNkwxNS43IDguNkgxOC4xOEwxNi43NCAxOC40Wk0yNS4xNCAxMy42MkMyNS4xNCAxMy42MiAyMy40NiAxMi44MiAyMi45OCAxMi43OEMyMi41IDEyLjc0IDIyLjE0IDEyLjk0IDIyLjE0IDEzLjM4QzIyLjE0IDEzLjc4IDIyLjUgMTQuMDIgMjMuMzggMTQuNThDMjQuNjIgMTUuMzQgMjUuNjYgMTYuMjIgMjUuNjYgMTcuNjZDMjUuNjYgMTkuNzggMjMuODYgMjAuNzggMjEuNzQgMjAuNzhDMjAuNSAyMC43OCAxOS4yNiAyMC40IDE4LjU0IDE5LjlMMTkuMTggMTcuNzRDMTkuNTggMTguMDIgMjAuNzggMTguNjYgMjEuNzggMTguNjZDMjIuMzggMTguNjYgMjMuMDIgMTguNCAyMy4wMiAxNy43OEMyMy4wMiAxNy4zOCAyMi42NiAxNy4wMiAyMS43OCAxNi40NkMyMC43NCAxNS44MiAxOS42NiAxNC45NCAxOS42NiAxMy41OEMxOS42NiAxMS41OCAyMS40NiAxMC41OCAyMy40NiAxMC41OEMyNC41NCAxMC41OCAyNS4zOCAxMC44NiAyNS45OCAxMS4yMkwyNS4xNCAxMy42MlpNMjkuNzQgMTguNEgyNy41NEwyNy44NiAxNi43NEMyNy4xIDEzLjk0IDI2LjcgMTEuNzQgMjYuNTggMTAuODZIMjkuMDZDMjkuMTggMTEuNTQgMjkuMzggMTIuNTQgMjkuNyAxMy43NEMzMC4wMiAxNS4wNiAzMC4zIDE2LjM0IDMwLjUgMTcuNThMMzEuNSAxMC44NkgzNC4wNkwzMC4yNiAxOC40SDI5Ljc0Wk0xMi41OCAxOC40TDEwLjMgMTAuODZINy45NEw2LjUgMTguNEg0TDYuNDYgOC42SDEwLjE0QzEwLjU4IDguNjIgMTAuOTQgOC45OCAxMS4wNiA5LjQyTDEyLjE0IDE0LjFMMTQuOTggOS40MkMxNS4xIDguOTggMTUuNDYgOC42MiAxNS45IDguNkgxOS4xOEwxNS4wNiAxOC40SDEyLjU4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
    mastercard: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA0MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iI0VCMDAxQiIvPgo8Y2lyY2xlIGN4PSIxNSIgY3k9IjEzIiByPSI3IiBmaWxsPSIjRkY1RjAwIi8+CjxjaXJjbGUgY3g9IjI1IiBjeT0iMTMiIHI9IjciIGZpbGw9IiNFQjAwMUIiLz4KPHBhdGggZD0iTTIwIDcuNUMyMS41IDguOCAyMi41IDEwLjcgMjIuNSAxM0MyMi41IDE1LjMgMjEuNSAxNy4yIDIwIDE4LjVDMTguNSAxNy4yIDE3LjUgMTUuMyAxNy41IDEzQzE3LjUgMTAuNyAxOC41IDguOCAyMCA3LjVaIiBmaWxsPSIjRkY1RjAwIi8+Cjwvc3ZnPgo=',
    amex: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA0MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iIzAwNkZDRiIvPgo8cGF0aCBkPSJNMTAgMTNIMThWMTVIMTBWMTNaTTEwIDEwSDE4VjEySDEwVjEwWk0yMiAxMEgzMFYxMkgyMlYxMFpNMjIgMTNIMzBWMTVIMjJWMTNaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    discover: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA0MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iI0ZGNjAwMCIvPgo8Y2lyY2xlIGN4PSIzMiIgY3k9IjEzIiByPSI4IiBmaWxsPSIjRkY5QjAwIi8+CjxwYXRoIGQ9Ik04IDEySDEyVjE0SDhWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    diners: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA0MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iIzAwNTlCOCIvPgo8Y2lyY2xlIGN4PSIxNSIgY3k9IjEzIiByPSI2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPGNpcmNsZSBjeD0iMjUiIGN5PSIxMyIgcj0iNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=',
    jcb: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA0MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iIzAwNTlCOCIvPgo8cGF0aCBkPSJNMTAgMTBIMTRWMTZIMTBWMTBaTTE4IDEwSDIyVjE2SDE4VjEwWk0yNiAxMEgzMFYxNkgyNlYxMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    unknown: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA0MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTUgMTBIMjVWMTJIMTVWMTBaTTE1IDE0SDI1VjE2SDE1VjE0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=='
};
/**
 * Get card icon data URI
 */
function getCardIcon(cardBrand) {
    return exports.CARD_ICONS[cardBrand] || exports.CARD_ICONS.unknown;
}
/**
 * Gateway icons
 */
exports.GATEWAY_ICONS = {
    stripe: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA2MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI5LjUgMTNDMjkuNSAxMC41IDI3LjUgOSAyNS41IDlDMjMuNSA5IDIxLjUgMTAuNSAyMS41IDEzQzIxLjUgMTUuNSAyMy41IDE3IDI1LjUgMTdDMjcuNSAxNyAyOS41IDE1LjUgMjkuNSAxM1oiIGZpbGw9IiM2MzVCRkYiLz4KPC9zdmc+Cg==',
    braintree: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA2MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEzQzIwIDEwIDIyIDggMjUgOEMyOCA4IDMwIDEwIDMwIDEzQzMwIDE2IDI4IDE4IDI1IDE4QzIyIDE4IDIwIDE2IDIwIDEzWiIgZmlsbD0iIzAwQUFGRiIvPgo8L3N2Zz4K',
    authorizenet: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCA2MCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDEwSDQ1VjEySDE1VjEwWk0xNSAxNEg0NVYxNkgxNVYxNFoiIGZpbGw9IiMwMDc1QkQiLz4KPC9zdmc+Cg=='
};
/**
 * Get gateway icon
 */
function getGatewayIcon(gateway) {
    const lowerGateway = gateway.toLowerCase().replace(/\s/g, '').replace('.', '');
    return exports.GATEWAY_ICONS[lowerGateway] || '';
}
/**
 * Preload card icons
 * Useful for improving perceived performance
 */
function preloadCardIcons() {
    if (typeof window === 'undefined') {
        return;
    }
    Object.values(exports.CARD_ICONS).forEach(iconDataUri => {
        const img = new Image();
        img.src = iconDataUri;
    });
}
/**
 * Get card icon as Image element
 */
function createCardIconElement(cardBrand, options) {
    if (typeof window === 'undefined') {
        return null;
    }
    const img = new Image();
    img.src = getCardIcon(cardBrand);
    img.alt = options?.alt || (0, card_validation_1.getCardBrandName)(cardBrand);
    if (options?.width) {
        img.width = options.width;
    }
    if (options?.height) {
        img.height = options.height;
    }
    if (options?.className) {
        img.className = options.className;
    }
    return img;
}
