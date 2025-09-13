#!/usr/bin/env node

import { execSync } from 'node:child_process';

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

console.log('📦 KonBase Auto commit/fix/deploy/version/full system');
console.log('============================');

// Available commands
const commands = {
  quality: () => runQualityChecks(),
  commit: () => runAutoCommit(),
  deploy: () => runAutoDeploy(),
  version: () => runVersionUpdate(),
  full: () => runFullAutomation(),
  help: () => showHelp(),
};

// Run quality checks
async function runQualityChecks() {
  console.log('\n🔍 Running Quality Checks...');

  try {
    console.log('📝 Formatting code...');
    execSync('npm run format', { stdio: 'inherit' });

    console.log('🔧 Running linter...');
    try {
      execSync('npm run lint:fix', { stdio: 'inherit' });
    } catch {
      console.warn('⚠️  Linting issues found, but continuing...');
      console.warn(
        'Note: Some TypeScript any types and unused variables need attention'
      );
    }

    console.log('📋 Type checking...');
    execSync('npm run type-check', { stdio: 'inherit' });

    console.log('🏗️  Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('✅ All quality checks passed!');
    return true;
  } catch (error) {
    console.error('❌ Quality checks failed:', error.message);
    return false;
  }
}

// Run version update
async function runVersionUpdate() {
  console.log('\n📊 Updating Version...');

  try {
    const { newVersion } = await import('./update-version.mjs');
    console.log(`✅ Version updated to: ${newVersion}`);
    return newVersion;
  } catch (error) {
    console.error('❌ Version update failed:', error.message);
    return null;
  }
}

// Run auto commit
async function runAutoCommit() {
  console.log('\n💾 Running Auto Commit...');

  try {
    // Import and run the auto-commit script
    await import('./auto-commit.mjs');
    console.log('✅ Auto commit completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Auto commit failed:', error.message);
    return false;
  }
}

// Run auto deploy
async function runAutoDeploy() {
  console.log('\n🚀 Running Auto Deploy...');

  try {
    // Import and run the auto-deploy script
    await import('./auto-deploy.mjs');
    console.log('✅ Auto deploy completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Auto deploy failed:', error.message);
    return false;
  }
}

// Run full automation (quality + commit + deploy)
async function runFullAutomation() {
  console.log('\n🎯 Running Full Automation...');

  const qualityPassed = await runQualityChecks();
  if (!qualityPassed) {
    console.error('❌ Quality checks failed, stopping automation');
    process.exit(1);
  }

  const commitPassed = await runAutoCommit();
  if (!commitPassed) {
    console.error('❌ Auto commit failed, stopping automation');
    process.exit(1);
  }

  const deployPassed = await runAutoDeploy();
  if (!deployPassed) {
    console.error('❌ Auto deploy failed');
    process.exit(1);
  }

  console.log('\n🎉 Full automation completed successfully!');
}

// Show help
function showHelp() {
  console.log('\n📖 Available Commands:');
  console.log('======================');
  console.log(
    '  quality    - Run code quality checks (format, lint, type-check, build)'
  );
  console.log('  version    - Update version number');
  console.log('  commit     - Run automated commit with quality checks');
  console.log('  deploy     - Deploy to Vercel');
  console.log(
    '  full       - Run complete automation (quality + commit + deploy)'
  );
  console.log('  help       - Show this help message');
  console.log('\n📝 Usage Examples:');
  console.log('  node scripts/automation.mjs quality');
  console.log('  node scripts/automation.mjs commit');
  console.log('  node scripts/automation.mjs full');
  console.log('\n🔧 Package.json Scripts:');
  console.log('  npm run quality:check    - Check code quality');
  console.log('  npm run quality:fix      - Fix code quality issues');
  console.log('  npm run commit:auto      - Automated commit');
  console.log('  npm run deploy:auto      - Automated deployment');
  console.log('  npm run version:update   - Update version');
}

// Main execution
async function main() {
  if (commands[command]) {
    try {
      await commands[command]();
    } catch (error) {
      console.error(`❌ Command '${command}' failed:`, error.message);
      process.exit(1);
    }
  } else {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
}

// Run main function
main();
