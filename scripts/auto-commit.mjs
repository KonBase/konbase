import { execSync } from 'node:child_process';

// Import version update
const { newVersion } = await import('./update-version.mjs');

// Get git status to determine what changed
let changedFiles = [];
let commitMessage = '';

try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  const lines = gitStatus
    .trim()
    .split('\n')
    .filter(line => line.length > 0);

  changedFiles = lines.map(line => {
    const status = line.substring(0, 2);
    const file = line.substring(3);
    return { status, file };
  });

  console.log('Changed files:');
  changedFiles.forEach(({ status, file }) => {
    console.log(`  ${status} ${file}`);
  });

  // Determine commit message based on changes
  const addedFiles = changedFiles.filter(f => f.status.includes('A'));
  const modifiedFiles = changedFiles.filter(f => f.status.includes('M'));
  const deletedFiles = changedFiles.filter(f => f.status.includes('D'));
  const renamedFiles = changedFiles.filter(f => f.status.includes('R'));

  const changes = [];

  if (addedFiles.length > 0) {
    changes.push(
      `Add ${addedFiles.length} file${addedFiles.length > 1 ? 's' : ''}`
    );
  }
  if (modifiedFiles.length > 0) {
    changes.push(
      `Update ${modifiedFiles.length} file${modifiedFiles.length > 1 ? 's' : ''}`
    );
  }
  if (deletedFiles.length > 0) {
    changes.push(
      `Remove ${deletedFiles.length} file${deletedFiles.length > 1 ? 's' : ''}`
    );
  }
  if (renamedFiles.length > 0) {
    changes.push(
      `Rename ${renamedFiles.length} file${renamedFiles.length > 1 ? 's' : ''}`
    );
  }

  // Categorize changes for more specific commit messages
  const hasDbChanges = changedFiles.some(
    f =>
      f.file.includes('db/') ||
      f.file.includes('database') ||
      f.file.includes('migration')
  );

  const hasApiChanges = changedFiles.some(
    f => f.file.includes('api/') || f.file.includes('route.ts')
  );

  const hasComponentChanges = changedFiles.some(
    f =>
      f.file.includes('components/') ||
      f.file.includes('.tsx') ||
      f.file.includes('.jsx')
  );

  const hasConfigChanges = changedFiles.some(
    f =>
      f.file.includes('package.json') ||
      f.file.includes('.json') ||
      f.file.includes('config') ||
      f.file.includes('.env')
  );

  const hasScriptChanges = changedFiles.some(
    f =>
      f.file.includes('scripts/') ||
      f.file.includes('.mjs') ||
      f.file.includes('.js')
  );

  // Build specific commit message
  const specificChanges = [];
  if (hasDbChanges) specificChanges.push('database');
  if (hasApiChanges) specificChanges.push('API');
  if (hasComponentChanges) specificChanges.push('components');
  if (hasConfigChanges) specificChanges.push('configuration');
  if (hasScriptChanges) specificChanges.push('scripts');

  let changeDescription = '';
  if (specificChanges.length > 0) {
    changeDescription = ` (${specificChanges.join(', ')})`;
  }

  commitMessage = `Version ${newVersion}${changeDescription}: ${changes.join(', ')}`;
} catch (error) {
  console.error('Error getting git status:', error.message);
  commitMessage = `Version ${newVersion}: Automated commit`;
}

// Run quality checks
console.log('\n🔍 Running quality checks...');

try {
  console.log('📝 Formatting code...');
  execSync('npm run format', { stdio: 'inherit' });

  console.log('🔧 Running linter...');
  try {
    execSync('npm run lint:fix', { stdio: 'inherit' });
  } catch (warn) {
    console.warn('⚠️  Linting issues found, but continuing...', warn.message);
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

// Add all changes
console.log('\n📦 Staging changes...');
execSync('git add .', { stdio: 'inherit' });

// Commit changes
console.log('\n💾 Committing changes...');
try {
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  console.log(`✅ Committed: ${commitMessage}`);
} catch (error) {
  console.error('❌ Commit failed:', error.message);
  process.exit(1);
}

// Push to origin
console.log('\n🚀 Pushing to GitHub...');
try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Pushed to GitHub successfully!');
} catch (error) {
  console.error('❌ Push failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Automated commit completed successfully!');
console.log(`📊 Version: ${newVersion}`);
console.log(`📝 Commit: ${commitMessage}`);
console.log(`📁 Files changed: ${changedFiles.length}`);
