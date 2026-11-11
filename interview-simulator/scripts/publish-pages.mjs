import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(appRoot, 'dist');
const repository = 'https://github.com/LeP-Ton/interview-simulator-pages.git';
const allowedExtensions = new Set(['.html', '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2']);

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} 执行失败，退出码 ${result.status}`);
}
function validate(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) throw new Error(`不允许发布隐藏文件或符号链接：${entry.name}`);
    if (entry.isDirectory()) validate(path);
    else if (!allowedExtensions.has(extname(entry.name).toLowerCase())) throw new Error(`不允许发布该文件类型：${entry.name}`);
  }
}

if (!existsSync(join(output, 'index.html'))) throw new Error('请先执行 npm run build');
validate(output);
const checkout = mkdtempSync(join(tmpdir(), 'interview-pages-publish-'));
try {
  run('git', ['clone', '--depth', '1', repository, checkout], appRoot);
  // 仅替换公开仓库中的网站产物，不复制源码、需求文档或本地配置。
  for (const name of ['assets', 'index.html', 'favicon.svg', '.nojekyll']) rmSync(join(checkout, name), { recursive: true, force: true });
  for (const name of readdirSync(output)) cpSync(join(output, name), join(checkout, name), { recursive: true });
  writeFileSync(join(checkout, '.nojekyll'), '');
  run('git', ['add', '--all'], checkout);
  const changed = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: checkout });
  if (changed.status === 1) run('git', ['-c', 'user.name=Pages Publisher', '-c', 'user.email=pages-publisher@users.noreply.github.com', 'commit', '-m', '发布面试模拟器网页产物'], checkout);
  else if (changed.status !== 0) throw new Error('无法检查待发布差异');
  run('git', ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', 'push', 'origin', 'HEAD:main'], checkout);
  console.log('网页产物已推送。请等待 GitHub Pages 构建完成后访问 https://lep-ton.github.io/interview-simulator-pages/');
} finally {
  if (statSync(checkout, { throwIfNoEntry: false })) rmSync(checkout, { recursive: true, force: true });
}
