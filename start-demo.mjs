// Local illustrative demo only. No backend is needed for Style Actions.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const projectDir = fileURLToPath(new URL('.', import.meta.url));
const vitePath = join(projectDir, 'node_modules/vite/bin/vite.js');
if (!existsSync(vitePath)) {
  console.error('Dependencies are missing. Run npm ci, then node start-demo.mjs.');
  process.exit(1);
}
console.log('Open the demo links in DEVELOPER_HANDOFF.md after Vite starts.');
const child = spawn(process.execPath, [vitePath, '--host', '127.0.0.1', '--port', '5183', '--strictPort'], {
  cwd: projectDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    DEV_HTTP: '1', ENV: 'development', SKIP_AUTH: 'true', VITE_SKIP_AUTH: 'true',
    USE_MOCK_DATA: 'true', VITE_USE_MOCK_DATA: 'true', VITE_STYLE_ACTIONS_DEMO: 'true',
    API_BASE_URL: 'http://127.0.0.1:5183', API_PROXY_TARGET: 'http://127.0.0.1:8000',
    DEV_COOKIES: '',
  },
});
child.on('error', error => { console.error(error.message); process.exit(1); });
child.on('exit', code => process.exit(code ?? 1));
