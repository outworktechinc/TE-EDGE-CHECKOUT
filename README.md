# Universal Packages Monorepo

A collection of framework-agnostic packages for common functionality across Next.js, Angular, React, Vue, and other JavaScript frameworks.

## 📦 Packages

### ✅ [@your-org/payment-gateway](./packages/payment-gateway)

**Status:** Production Ready

Framework-agnostic payment gateway integration library supporting:
- ✅ Stripe
- ✅ Braintree
- ✅ Authorize.Net
- ✅ Dynamic gateway detection
- ✅ Edge Checkout & Hosted Checkout
- ✅ Card validation
- ✅ 3D Secure (SCA)
- ✅ Currency utilities
- ✅ Transaction logging

**Install:**
```bash
npm install @your-org/payment-gateway
```

**Docs:** [Payment Gateway Documentation](./packages/payment-gateway/README.md)

---

### 🚧 [@your-org/sentry-integration](./packages/sentry-integration)

**Status:** Coming Soon

Universal Sentry integration for error tracking and monitoring.

**Planned Features:**
- Framework-agnostic Sentry initialization
- Automatic error capturing
- Performance monitoring
- User context tracking

---

### 🚧 [@your-org/track-ids](./packages/track-ids)

**Status:** Coming Soon

Universal tracking IDs management for analytics and user tracking.

**Planned Features:**
- UTM parameter tracking
- Session ID management
- User ID tracking
- Analytics integration

---

## 🚀 Quick Start

### For Users (Install Specific Package)

```bash
# Install only the payment gateway
npm install @your-org/payment-gateway

# Or install sentry integration (when available)
npm install @your-org/sentry-integration

# Or install track-ids (when available)
npm install @your-org/track-ids
```

Each package is **completely independent** - you only install what you need!

### For Developers (Working on Packages)

```bash
# Clone the repository
git clone https://github.com/your-org/universal-packages.git
cd universal-packages

# Install all dependencies for all packages
npm install

# Build all packages
npm run build

# Build specific package
npm run build:payment

# Test all packages
npm run test

# Lint all packages
npm run lint
```

---

## 📁 Project Structure

```
universal-packages/
├── packages/
│   ├── payment-gateway/          # ✅ Production Ready
│   │   ├── src/
│   │   ├── dist/
│   │   ├── examples/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── sentry-integration/        # 🚧 Coming Soon
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── track-ids/                 # 🚧 Coming Soon
│       ├── package.json
│       └── README.md
│
├── package.json                   # Root workspace config
├── README.md                      # This file
└── .gitignore
```

---

## 🛠️ Available Scripts

### Root Level

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Build specific packages
npm run build:payment
npm run build:sentry
npm run build:track-ids

# Test all packages
npm run test

# Test specific package
npm run test:payment

# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix

# Clean all build artifacts
npm run clean

# Publish specific package
npm run publish:payment
```

### Individual Package Level

```bash
# Navigate to package
cd packages/payment-gateway

# Install dependencies
npm install

# Build
npm run build

# Test
npm run test

# Lint
npm run lint
```

---

## 🎯 Package Independence

Each package in this monorepo is **completely independent**:

✅ **Independent `package.json`** - Each has its own dependencies and version
✅ **Independent publishing** - Publish packages separately
✅ **Independent installation** - Users install only what they need
✅ **Independent versioning** - Each package has its own version
✅ **Independent documentation** - Each has complete docs

Users who only need the payment gateway will **NOT** install Sentry or tracking packages!

---

## 📖 Package Documentation

Each package has its own comprehensive documentation:

| Package | Documentation |
|---------|--------------|
| Payment Gateway | [README.md](./packages/payment-gateway/README.md) |
| | [Next.js Guide](./packages/payment-gateway/NEXTJS_IMPLEMENTATION_GUIDE.md) |
| | [Angular Guide](./packages/payment-gateway/ANGULAR_IMPLEMENTATION_GUIDE.md) |
| | [Gateway Detection](./packages/payment-gateway/GATEWAY_DETECTION.md) |
| | [API Reference](./packages/payment-gateway/README.md#api-reference) |
| Sentry Integration | [README.md](./packages/sentry-integration/README.md) |
| Track IDs | [README.md](./packages/track-ids/README.md) |

---

## 🔧 Development Workflow

### Adding a New Package

1. Create package directory:
```bash
mkdir -p packages/your-new-package
cd packages/your-new-package
```

2. Initialize package:
```bash
npm init -y
```

3. Update package.json with proper name:
```json
{
  "name": "@your-org/your-new-package",
  "version": "1.0.0"
}
```

4. The package is automatically included in the workspace!

### Working on a Package

```bash
# Navigate to package
cd packages/payment-gateway

# Make changes to src/

# Build to test
npm run build

# Run tests
npm run test

# Lint code
npm run lint:fix
```

### Publishing a Package

```bash
# From root, publish specific package
npm run publish:payment

# Or navigate to package and publish
cd packages/payment-gateway
npm publish
```

---

## 🌟 Framework Support

All packages are designed to work with:

- ✅ **Next.js** (App Router & Pages Router)
- ✅ **Angular** (14+)
- ✅ **React**
- ✅ **Vue**
- ✅ **Vanilla JavaScript**
- ✅ **TypeScript**

Each package includes framework-specific integration guides!

---

## 📋 Package Checklist

When creating a new package, ensure it has:

- [ ] `package.json` with correct name and version
- [ ] `README.md` with usage examples
- [ ] `src/` directory with TypeScript source
- [ ] `tsconfig.json` for TypeScript configuration
- [ ] Build scripts for CommonJS and ESM
- [ ] Type definitions (`.d.ts` files)
- [ ] Tests
- [ ] Examples directory
- [ ] Framework-specific guides (Next.js, Angular, etc.)
- [ ] Proper exports in main entry file
- [ ] `.gitignore` for build artifacts

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`npm run test`)
- Code is linted (`npm run lint`)
- Documentation is updated
- Examples are provided

---

## 🔐 Security

If you discover a security vulnerability, please email security@your-org.com

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🙋 Support

- 📧 Email: support@your-org.com
- 💬 GitHub Issues: [Create an issue](https://github.com/your-org/universal-packages/issues)
- 📖 Documentation: [Package-specific docs](./packages)

---

## 🗺️ Roadmap

### Current (v1.0)
- ✅ Payment Gateway - Production ready
- 🚧 Sentry Integration - In development
- 🚧 Track IDs - Planned

### Future (v2.0)
- 📋 Form validation library
- 📋 Authentication library
- 📋 API client library
- 📋 State management library
- 📋 UI component library (framework-agnostic)

---

## ⭐ Show Your Support

If you find these packages helpful, please give the repository a star!

---

**Made with ❤️ by Your Organization**
