# Build and Publish Guide

This guide shows you how to build, test, and publish the payment gateway library.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- GitHub account (for repository)
- npm account (for publishing)

## Step 1: Install Dependencies

```bash
cd "D:\Rajnish workspace\payment-gateway-library"
npm install
```

This will install:
- TypeScript
- ESLint
- Jest (for testing)
- Rimraf (for cleaning)
- Type definitions

## Step 2: Build the Library

```bash
npm run build
```

This will:
1. Clean the `dist/` folder
2. Compile TypeScript to CommonJS (dist/)
3. Compile TypeScript to ES Modules (dist/esm/)
4. Generate type declarations (dist/*.d.ts)

**Output:**
```
dist/
├── index.js              # CommonJS entry
├── index.d.ts            # Type definitions
├── types/
├── utils/
├── gateways/
└── esm/                  # ES Module output
    ├── index.js
    ├── types/
    ├── utils/
    └── gateways/
```

## Step 3: Test Locally

### Option A: Use npm link

In the library folder:
```bash
npm link
```

In your Next.js or Angular project:
```bash
npm link @your-org/payment-gateway
```

### Option B: Use file path

In your project's `package.json`:
```json
{
  "dependencies": {
    "@your-org/payment-gateway": "file:../payment-gateway-library"
  }
}
```

Then run:
```bash
npm install
```

### Test in Next.js

1. Copy `examples/nextjs/payment-adapter.ts` to your project
2. Copy `examples/nextjs/payment-gateway.ts` to your project
3. Create a test component:

```typescript
import { paymentGateway } from './payment-gateway';

export default function TestPage() {
  const test = async () => {
    try {
      paymentGateway.setActiveGateway('Stripe');
      const result = await paymentGateway.createPaymentToken(
        {
          number: '4242424242424242',
          expMonth: '12',
          expYear: '2025',
          cvc: '123'
        },
        'Stripe'
      );
      console.log('Success!', result);
    } catch (error) {
      console.error('Failed!', error);
    }
  };

  return <button onClick={test}>Test Payment</button>;
}
```

### Test in Angular

1. Copy example files from `examples/angular/`
2. Import `HttpClientModule` in app.module.ts
3. Create a test component
4. Run the app and test

## Step 4: Update package.json

Before publishing, update the package name and details:

```json
{
  "name": "@your-username/payment-gateway",
  "version": "1.0.0",
  "description": "Framework-agnostic payment gateway library",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/payment-gateway.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/payment-gateway/issues"
  },
  "homepage": "https://github.com/your-username/payment-gateway#readme"
}
```

## Step 5: Connect to GitHub

### Initialize Git

```bash
cd "D:\Rajnish workspace\payment-gateway-library"
git init
git add .
git commit -m "Initial commit: Framework-agnostic payment gateway library

- Add support for Stripe, Braintree, and Authorize.Net
- Add framework adapters for Next.js and Angular
- Add comprehensive documentation and examples
- Add TypeScript type definitions
"
```

### Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `payment-gateway`
3. Description: "Framework-agnostic payment gateway integration library"
4. Public or Private (your choice)
5. **Don't** initialize with README (we have one)
6. Click "Create repository"

### Push to GitHub

```bash
git branch -M main
git remote add origin https://github.com/your-username/payment-gateway.git
git push -u origin main
```

## Step 6: Publish to NPM

### Option A: Public NPM Package

1. **Login to npm:**
```bash
npm login
```

2. **Publish:**
```bash
npm publish --access public
```

### Option B: GitHub Packages (Private)

1. **Update package.json:**
```json
{
  "name": "@your-username/payment-gateway",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

2. **Create .npmrc in the library folder:**
```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@your-username:registry=https://npm.pkg.github.com
```

3. **Publish:**
```bash
npm publish
```

### Option C: Private NPM Registry

If you have a private registry:
```bash
npm publish --registry https://your-registry.com
```

## Step 7: Use in Projects

### Install from NPM

```bash
npm install @your-username/payment-gateway
```

### Install from GitHub Packages

```bash
npm install @your-username/payment-gateway
```

Configure `.npmrc` in your project:
```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@your-username:registry=https://npm.pkg.github.com
```

## Versioning

Follow semantic versioning:

### Patch Release (1.0.0 → 1.0.1)
Bug fixes, minor changes:
```bash
npm version patch
npm publish
```

### Minor Release (1.0.0 → 1.1.0)
New features, backward compatible:
```bash
npm version minor
npm publish
```

### Major Release (1.0.0 → 2.0.0)
Breaking changes:
```bash
npm version major
npm publish
```

## Maintenance

### Update the Library

1. Make changes to code
2. Update CHANGELOG.md
3. Run tests: `npm test`
4. Build: `npm run build`
5. Bump version: `npm version patch|minor|major`
6. Commit changes: `git commit -am "Description"`
7. Push to GitHub: `git push && git push --tags`
8. Publish: `npm publish`

### Add New Gateway

1. Create `src/gateways/newgateway.ts`
2. Follow the pattern from existing gateways
3. Update `src/index.ts` to include new gateway
4. Update `src/types/index.ts` to add gateway name
5. Add example in `examples/`
6. Update documentation
7. Publish new version

## CI/CD (Optional)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Publish Fails (401 Unauthorized)

```bash
# Re-login to npm
npm logout
npm login
```

### Package Name Already Exists

Change the name in package.json to something unique:
```json
{
  "name": "@your-username/unique-payment-gateway"
}
```

### TypeScript Errors

```bash
# Check TypeScript config
npm run type-check

# Fix errors and rebuild
npm run build
```

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Build library
npm run build

# Watch mode (development)
npm run build:watch

# Run tests
npm test

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Clean build
npm run clean

# Publish to npm
npm publish

# Version bump
npm version patch|minor|major
```

## Support

- 📖 Documentation: README.md
- 🔧 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

## Next Steps

1. ✅ Install dependencies
2. ✅ Build the library
3. ✅ Test locally in your projects
4. ✅ Push to GitHub
5. ✅ Publish to NPM
6. ✅ Update projects to use the published package

Good luck! 🚀
