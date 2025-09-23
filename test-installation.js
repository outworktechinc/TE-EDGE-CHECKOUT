#!/usr/bin/env node
/**
 * Local Package Installation Test
 * Tests the package installation and imports
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Universal Payments NextJS Package...\n');

// Test 1: Check if build output exists
console.log('1. Checking build output...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ dist/ directory exists');

  const indexJs = path.join(distPath, 'index.js');
  const indexDts = path.join(distPath, 'index.d.ts');

  if (fs.existsSync(indexJs)) {
    console.log('✅ index.js built successfully');
  } else {
    console.log('❌ index.js missing');
  }

  if (fs.existsSync(indexDts)) {
    console.log('✅ index.d.ts built successfully');
  } else {
    console.log('❌ index.d.ts missing');
  }
} else {
  console.log('❌ dist/ directory missing');
}

// Test 2: Check package.json
console.log('\n2. Checking package.json...');
const packageJson = require('./package.json');
if (packageJson.name === '@your-company/universal-payments-nextjs') {
  console.log('✅ Package name correct');
} else {
  console.log('❌ Package name incorrect');
}

if (packageJson.main === 'dist/index.js') {
  console.log('✅ Main entry point correct');
} else {
  console.log('❌ Main entry point incorrect');
}

if (packageJson.types === 'dist/index.d.ts') {
  console.log('✅ TypeScript definitions correct');
} else {
  console.log('❌ TypeScript definitions incorrect');
}

// Test 3: Try to require the built package (basic syntax check)
console.log('\n3. Testing package import...');
try {
  const packageExports = require('./dist/index.js');

  const expectedExports = [
    'PaymentProcessor',
    'StripeCheckout',
    'BraintreeDropIn',
    'AuthorizeNetForm',
    'PaymentProcessingService',
    'StripeService',
    'usePaymentMethodStore'
  ];

  let allExportsFound = true;
  expectedExports.forEach(exportName => {
    if (packageExports[exportName]) {
      console.log(`✅ ${exportName} exported correctly`);
    } else {
      console.log(`❌ ${exportName} missing from exports`);
      allExportsFound = false;
    }
  });

  if (allExportsFound) {
    console.log('✅ All expected exports found');
  }

} catch (error) {
  console.log('❌ Failed to import package:', error.message);
}

// Test 4: Check dependencies
console.log('\n4. Checking dependencies...');
const requiredDeps = ['@stripe/stripe-js', 'zustand'];
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} dependency listed`);
  } else {
    console.log(`❌ ${dep} dependency missing`);
  }
});

const requiredPeerDeps = ['react', 'react-dom', 'next'];
requiredPeerDeps.forEach(dep => {
  if (packageJson.peerDependencies[dep]) {
    console.log(`✅ ${dep} peer dependency listed`);
  } else {
    console.log(`❌ ${dep} peer dependency missing`);
  }
});

console.log('\n📦 Package test completed!');
console.log('\nNext steps:');
console.log('1. Create GitHub repository: https://github.com/your-company/universal-payments-nextjs');
console.log('2. Push this code to GitHub');
console.log('3. Set up GitHub Packages');
console.log('4. Install in your project: npm install @your-company/universal-payments-nextjs');