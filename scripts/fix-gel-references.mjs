#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing GelDB references...');

// Files that need to be updated
const filesToUpdate = [
  'src/app/api/admin/check-permissions/route.ts',
  'src/app/api/admin/system-stats/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/verify-2fa/route.ts',
  'src/app/api/admin/verify-password/route.ts',
  'src/app/api/auth/forgot/route.ts',
  'src/app/api/auth/reset/route.ts',
  'src/app/api/auth/signup/route.ts',
  'src/app/api/inventory/equipment-sets/route.ts',
  'src/app/api/inventory/items/route.ts',
  'src/app/api/invitations/route.ts',
  'src/app/api/reports/[reportType]/route.ts',
  'src/app/api/search/route.ts',
  'src/app/api/users/profile/route.ts',
  'src/app/api/users/totp/route.ts',
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace import
  if (content.includes("import { geldb } from '@/lib/db/gel';")) {
    content = content.replace(
      "import { geldb } from '@/lib/db/gel';",
      "import { createDataAccessLayer } from '@/lib/db/data-access';"
    );
    modified = true;
  }

  // Replace geldb.querySingle with dataAccess.executeQuerySingle
  if (content.includes('geldb.querySingle')) {
    content = content.replace(
      /geldb\.querySingle/g,
      'dataAccess.executeQuerySingle'
    );
    modified = true;
  }

  // Replace geldb.query with dataAccess.executeQuery
  if (content.includes('geldb.query')) {
    content = content.replace(/geldb\.query/g, 'dataAccess.executeQuery');
    modified = true;
  }

  // Add dataAccess initialization after session check
  if (
    content.includes('const session = await getServerSession(authOptions);')
  ) {
    const sessionCheckPattern =
      /(const session = await getServerSession\(authOptions\);\s+if \(!session\?\.\w+\?\.\w+\) \{\s+return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s+\})/;
    if (sessionCheckPattern.test(content)) {
      content = content.replace(
        sessionCheckPattern,
        '$1\n\n    const dataAccess = createDataAccessLayer();'
      );
      modified = true;
    }
  }

  // Fix SQL syntax - remove GelDB specific syntax
  content = content.replace(/<str>\$/g, '$');
  content = content.replace(/<int>\$/g, '$');
  content = content.replace(/<bool>\$/g, '$');

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

// Update all files
filesToUpdate.forEach(updateFile);

console.log('🎉 GelDB references fixed!');
