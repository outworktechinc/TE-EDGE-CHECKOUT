# @your-org/track-ids

> 🚧 **Coming Soon** - This package is under development

## Overview

Universal tracking IDs management for analytics, UTM parameters, and user tracking across different frameworks.

## Planned Features

- ✅ UTM parameter tracking
- ✅ Session ID management
- ✅ User ID tracking
- ✅ Custom tracking parameters
- ✅ Cookie-based persistence
- ✅ LocalStorage fallback
- ✅ Server-side tracking support
- ✅ Analytics integration (Google Analytics, Mixpanel, etc.)
- ✅ Next.js integration
- ✅ Angular integration
- ✅ React integration
- ✅ Vue integration

## Installation

```bash
# This package is not yet published
npm install @your-org/track-ids
```

## Usage

```typescript
// Coming soon
import { initTracking, trackEvent } from '@your-org/track-ids';

// Initialize tracking
initTracking({
  enableUTM: true,
  enableSession: true,
  cookieDomain: '.yourdomain.com'
});

// Track custom event
trackEvent('button_click', {
  button: 'checkout',
  source: 'homepage'
});

// Get UTM parameters
const utmParams = getUTMParams();
console.log(utmParams);
```

## Tracking Parameters

### UTM Parameters
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

### Session Tracking
- Session ID generation
- Session duration tracking
- Page view tracking

### User Tracking
- User ID management
- Anonymous tracking
- User properties

## Status

🚧 Under Development

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT
