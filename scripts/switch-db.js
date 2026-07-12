/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];
if (target !== 'postgres' && target !== 'sqlite') {
  console.error('Usage: node switch-db.js <postgres|sqlite>');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (target === 'postgres') {
  schema = schema.replace(
    /datasource db \{\s*provider\s*=\s*"sqlite"\s*\}/g,
    'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}'
  );
  console.log('Switched Prisma schema datasource to postgresql.');
} else {
  schema = schema.replace(
    /datasource db \{\s*provider\s*=\s*"postgresql"[\s\S]*?\}/g,
    'datasource db {\n  provider = "sqlite"\n}'
  );
  console.log('Switched Prisma schema datasource to sqlite.');
}

fs.writeFileSync(schemaPath, schema, 'utf8');

console.log('Regenerating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client regenerated successfully.');
} catch (error) {
  console.error('Failed to regenerate Prisma client:', error);
  process.exit(1);
}
