import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const run = (file, args) => {
  const result = spawnSync(process.execPath, [file, ...args], { cwd: root, stdio: 'inherit', env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: '1' } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run('scripts/generate-content.mjs', []);
run('scripts/generate-portals.mjs', []);
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
for (const [edition, config] of [['journal', '.storybook'], ['operations', '.storybook-operations']]) {
  run('node_modules/storybook/dist/bin/dispatcher.js', ['build', '--config-dir', config, '--output-dir', `dist/${edition}`, '--disable-telemetry']);
}
run('node_modules/vite/bin/vite.js', ['build', '--config', 'vite.showcase.config.ts']);
run('scripts/write-portal-index.mjs', []);
