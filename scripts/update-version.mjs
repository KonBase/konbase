import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current date components
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');

// Read current package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parse current version
const currentVersion = packageJson.version;
const versionMatch = currentVersion.match(
  /^0\.(\d{4})\.(\d{2})(\d{2})(\d{3})$/
);

let newVersion;
if (versionMatch) {
  const [, currentYear, currentMonth, currentDay, currentVersionNum] =
    versionMatch;

  // Check if it's the same day
  if (
    currentYear === year.toString() &&
    currentMonth === month &&
    currentDay === day
  ) {
    // Same day, increment version number
    const versionNum = parseInt(currentVersionNum) + 1;
    newVersion = `0.${year}.${month}${day}${String(versionNum).padStart(3, '0')}`;
  } else {
    // New day, start from 001
    newVersion = `0.${year}.${month}${day}001`;
  }
} else {
  // First version or invalid format, start fresh
  newVersion = `0.${year}.${month}${day}001`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Create VERSION file for easy access
const versionPath = path.join(__dirname, '..', 'VERSION');
fs.writeFileSync(versionPath, newVersion + '\n');

console.log(`Version updated from ${currentVersion} to ${newVersion}`);
console.log(`Version format: 0.RRRR.MMDDVVV`);
console.log(`- RRRR: ${year} (current year)`);
console.log(`- MM: ${month} (current month)`);
console.log(`- DD: ${day} (current day)`);
console.log(`- VVV: ${newVersion.slice(-3)} (version number)`);

export { newVersion };
