// nuwa-sdlc-kit v1.1.0 · engine file — 托管件，upgrade 会覆盖手工修改
// PreToolUse 秘钥守护。策略读目标仓根 .sdlc.json（可缺省）：
//   { "protectedWrite": ["docs/x.md"], "secrets": { "extraPatterns": [] }, "buildNoiseExempt": ["dist"] }
// 协议：stdin 事件 JSON；exit 0 放行 / exit 2 阻断（stderr 给 Claude）。
import { readFileSync } from 'node:fs';
import { relative, isAbsolute, resolve, sep } from 'node:path';

const loadCfg = cwd => {
  try { return JSON.parse(readFileSync(resolve(cwd, '.sdlc.json'), 'utf8')); } catch { return {}; }
};

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(raw); } catch { process.exit(0); }

  const tool = ev.tool_name ?? '';
  const ti = ev.tool_input ?? {};
  const cwd = ev.cwd || process.cwd();
  const cfg = loadCfg(cwd);
  const reason = msg => { console.error(msg); process.exit(2); };

  const PATH_SECRET = [
    /(^|[\\/])\.env(\.[^\\/]+)?$/i,
    /\.pem$/i, /\.key$/i, /\.(pfx|p12)$/i,
    /(^|\/)(id_rsa|id_ed25519|id_ecdsa)$/i,
    /credential/i, /secret[s]?\.(json|ya?ml|txt)$/i,
    ...(cfg.secrets?.extraPatterns ?? []).map(s => new RegExp(s, 'i')),
  ];
  const BASH_SECRET = [
    /(^|[\s'"=;|&(])\.env(\.[A-Za-z0-9_-]+)?(?=$|[\s'"|;&)])/,
    /(?:^|[;&|]\s*)(?:cat|head|tail|less|more|cp|mv|tee)\s+[^;&|]*\.pem\b/i,
  ];
  const NOISE = new RegExp(`(^|/)(${['node_modules', 'buildtrees', 'vcpkg_installed', 'target', 'dist', ...(cfg.buildNoiseExempt ?? [])].join('|')})/`);
  // release/、out/ 默认不豁免：签名产物高发地

  const normRel = p => {
    if (!p) return '';
    const abs = isAbsolute(p) ? p : resolve(cwd, p);
    return relative(cwd, abs).split(sep).join('/');
  };

  const isExample = c => /\.(example|sample|template)$/i.test(c);
  const hitPath = c => !isExample(c) && !NOISE.test(c) && PATH_SECRET.some(re => re.test(c));
  const hitBash = c => !isExample(c) && BASH_SECRET.some(re => re.test(c));

  const candidates = tool === 'Bash' ? [String(ti.command ?? '')] : [normRel(ti.file_path)].filter(Boolean);
  for (const c of candidates) {
    if ((tool === 'Bash' ? hitBash : hitPath)(c)) {
      reason(`[guard-paths:${cfg.name ?? 'repo'}] 拒绝该 ${tool} 动作（命中秘钥护栏）：凭证不得进入会话与 diff。正当需求请人工评审后调整 .sdlc.json 的 secrets.extraPatterns。`);
    }
  }
  // 受保护路径（默认只拦写，不拦读）——由 .sdlc.json protectedWrite 配置
  const protectedWrite = cfg.protectedWrite ?? [];
  if (protectedWrite.length && tool !== 'Read' && tool !== 'Bash') {
    for (const c of candidates) {
      if (protectedWrite.includes(c)) {
        reason(`[guard-paths:${cfg.name ?? 'repo'}] 「${c}」为受保护文件（.sdlc.json protectedWrite），禁止 agent 直接编辑，请人工评审后修改。`);
      }
    }
  }
  process.exit(0);
});
