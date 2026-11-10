import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ['node_modules/storybook/bin/index.cjs', 'dev', '--port', process.env.PORT || '6006', '--host', '0.0.0.0', '--no-open', '--ci', '--disable-telemetry'], { stdio: 'inherit', env: process.env });
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
