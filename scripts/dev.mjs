import { spawn } from 'node:child_process';
const operations = process.argv.includes('--edition=operations');
const child = spawn(process.execPath, ['node_modules/storybook/dist/bin/dispatcher.js', 'dev', '--config-dir', operations ? '.storybook-operations' : '.storybook', '--port', process.env.PORT || (operations ? '6007' : '6006'), '--host', '0.0.0.0', '--no-open', '--ci', '--disable-telemetry'], { stdio: 'inherit', env: process.env });
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
