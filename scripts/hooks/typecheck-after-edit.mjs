// Claude Code PostToolUse hook: after an agent edits a TypeScript file under tests/ or src/,
// typecheck the project and feed errors back to the agent (exit code 2) so it fixes them right away.
import { execFileSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;

let file = '';
try {
  const event = JSON.parse(input);
  file = event.tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

if (!/[\\/](tests|src)[\\/].*\.ts$/.test(file)) process.exit(0);

try {
  execFileSync('npx', ['tsc', '--noEmit', '--pretty', 'false'], { stdio: 'pipe', encoding: 'utf8', shell: process.platform === 'win32' });
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(0, 30).join('\n');
  console.error(`Typecheck failed after editing ${file}. Fix these before continuing:\n${output}`);
  process.exit(2);
}
