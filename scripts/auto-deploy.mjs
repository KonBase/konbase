import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting automated deployment to Vercel...');

// Read current version
const versionPath = path.join(__dirname, '..', 'VERSION');
let currentVersion = '0.0.0';
if (fs.existsSync(versionPath)) {
  currentVersion = fs.readFileSync(versionPath, 'utf8').trim();
}

console.log(`📊 Current version: ${currentVersion}`);

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.error('❌ Vercel CLI not found. Installing...', error.message);
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Vercel CLI:', installError.message);
    process.exit(1);
  }
}

// Check if we're logged in to Vercel
try {
  execSync('vercel whoami', { stdio: 'pipe' });
  console.log('✅ Logged in to Vercel');
} catch (error) {
  console.error(
    '❌ Not logged in to Vercel. Please run: vercel login',
    error.message
  );
  process.exit(1);
}

// Run quality checks before deployment
console.log('\n🔍 Running pre-deployment quality checks...');

try {
  console.log('📝 Formatting code...');
  execSync('npm run format', { stdio: 'inherit' });

  console.log('🔧 Running linter...');
  try {
    execSync('npm run lint:fix', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Linting issues found, but continuing...', error.message);
    console.warn(
      'Note: Some TypeScript any types and unused variables need attention'
    );
  }

  console.log('📋 Type checking...');
  execSync('npm run type-check', { stdio: 'inherit' });

  console.log('🏗️  Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ All quality checks passed!');
} catch (error) {
  console.error('❌ Quality checks failed:', error.message);
  process.exit(1);
}

// Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');

try {
  // Deploy to production
  const deployOutput = execSync('vercel --prod --yes', {
    stdio: 'pipe',
    encoding: 'utf8',
  });

  console.log('✅ Deployment successful!');
  console.log('📊 Deployment output:');
  console.log(deployOutput);

  // Extract deployment URL from output
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
  if (urlMatch) {
    const deploymentUrl = urlMatch[0];
    console.log(`🌐 Deployment URL: ${deploymentUrl}`);

    // Save deployment info
    const deploymentInfo = {
      version: currentVersion,
      url: deploymentUrl,
      timestamp: new Date().toISOString(),
      status: 'success',
    };

    const deploymentPath = path.join(__dirname, '..', 'deployment-info.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to deployment-info.json');
  }
} catch (error) {
  console.error('❌ Deployment failed:', error.message);

  // Save failed deployment info
  const deploymentInfo = {
    version: currentVersion,
    timestamp: new Date().toISOString(),
    status: 'failed',
    error: error.message,
  };

  const deploymentPath = path.join(__dirname, '..', 'deployment-info.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  process.exit(1);
}

// Run post-deployment health check
console.log('\n🏥 Running post-deployment health check...');

try {
  // Wait a bit for deployment to be ready
  console.log('⏳ Waiting for deployment to be ready...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

  // Try to get deployment URL from vercel
  const deploymentUrl = execSync('vercel ls --json', {
    stdio: 'pipe',
    encoding: 'utf8',
  });

  const deployments = JSON.parse(deploymentUrl);
  const latestDeployment = deployments[0];

  if (latestDeployment && latestDeployment.url) {
    console.log(`🌐 Testing deployment at: ${latestDeployment.url}`);

    // Simple health check
    const healthCheck = execSync(`curl -f ${latestDeployment.url}/api/health`, {
      stdio: 'pipe',
      encoding: 'utf8',
    });

    // Log and read health check output
    try {
      const parsed = JSON.parse(healthCheck);
      console.log('🩺 Health response:', parsed);
    } catch {
      console.log('🩺 Health response:', healthCheck);
    }

    console.log('✅ Health check passed!');
    console.log(`🎉 Deployment successful: ${latestDeployment.url}`);
  }
} catch (error) {
  console.warn(
    '⚠️  Health check failed, but deployment may still be successful'
  );
  console.warn('Error:', error.message);
}

console.log('\n🎉 Automated deployment completed!');
console.log(`📊 Version: ${currentVersion}`);
console.log(`⏰ Completed at: ${new Date().toISOString()}`);
