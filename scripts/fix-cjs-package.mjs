import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cjsDir = join(__dirname, '..', 'dist', 'cjs');

mkdirSync(cjsDir, { recursive: true });

// Mark the CJS output directory as CommonJS so Node treats it correctly
// even though the root package.json has "type": "module".
writeFileSync(
  join(cjsDir, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2) + '\n'
);

console.log('Wrote dist/cjs/package.json with {"type":"commonjs"}');
