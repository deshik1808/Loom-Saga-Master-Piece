import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const distDir = resolve(rootDir, 'dist');

const copyTargets = [
  { from: 'js', to: 'js' },
  { from: 'data', to: 'data' },
  { from: 'assets/icons', to: 'assets/icons' },
];

for (const target of copyTargets) {
  const sourcePath = resolve(rootDir, target.from);
  const destinationPath = resolve(distDir, target.to);

  if (!existsSync(sourcePath)) {
    console.warn(`[postbuild] Skipping missing path: ${target.from}`);
    continue;
  }

  cpSync(sourcePath, destinationPath, { recursive: true, force: true });
  console.log(`[postbuild] Copied ${target.from} -> dist/${target.to}`);
}
