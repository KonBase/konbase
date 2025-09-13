#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🤖 KonBase Automation Setup');
console.log('============================');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error(
    '❌ package.json not found. Please run this script from the project root.'
  );
  process.exit(1);
}

console.log('📦 Installing dependencies...');

try {
  // Install new dependencies
  const dependencies = [
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    'husky',
    'lint-staged',
    'prettier',
  ];

  console.log('Installing:', dependencies.join(', '));
  execSync(`npm install --save-dev ${dependencies.join(' ')}`, {
    stdio: 'inherit',
  });
  console.log('✅ Dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\n🔧 Setting up Husky...');

try {
  // Initialize Husky
  execSync('npm run prepare', { stdio: 'inherit' });
  console.log('✅ Husky initialized successfully!');
} catch (error) {
  console.error('❌ Failed to initialize Husky:', error.message);
  process.exit(1);
}

console.log('\n📝 Making scripts executable...');

try {
  // Make scripts executable
  const scripts = [
    'scripts/update-version.mjs',
    'scripts/auto-commit.mjs',
    'scripts/auto-deploy.mjs',
    'scripts/automation.mjs',
    'scripts/setup-automation.mjs',
  ];

  scripts.forEach(script => {
    const scriptPath = path.join(__dirname, '..', script);
    if (fs.existsSync(scriptPath)) {
      fs.chmodSync(scriptPath, '755');
      console.log(`✅ Made ${script} executable`);
    }
  });
} catch (error) {
  console.error('❌ Failed to make scripts executable:', error.message);
  process.exit(1);
}

console.log('\n🧪 Testing automation system...');

try {
  // Test version update
  console.log('Testing version update...');
  execSync('npm run version:update', { stdio: 'inherit' });

  // Test quality checks
  console.log('Testing quality checks...');
  execSync('npm run quality:check', { stdio: 'inherit' });

  console.log('✅ Automation system test passed!');
} catch (error) {
  console.error('❌ Automation system test failed:', error.message);
  console.log('💡 You may need to fix some code quality issues first.');
}

console.log('\n🎉 Automation setup completed successfully!');
console.log('\n📖 Next steps:');
console.log('1. Run "npm run automation" to see available commands');
console.log('2. Run "npm run automation:quality" to test quality checks');
console.log('3. Run "npm run automation:full" for complete automation');
console.log('\n📚 Documentation:');
console.log('- Read AUTOMATION.md for detailed usage instructions');
console.log('- Check .cursor/rules/automation.mdc for Cursor rules');
console.log('\n🚀 Ready to use automated development workflow!');
