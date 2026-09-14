/**
 * 会话内展示的沙箱绝对路径解析（V2 工具详情文件路径点击打开预览用）。
 * 纯模块，可被 vitest 直接测试。
 */

/** 沙箱家目录前缀：会话工作区绝对路径形如 /home/user/{conversationId}/{relativePath} */
const SANDBOX_HOME_PREFIX = '/home/user/';

export interface SandboxAbsolutePath {
  conversationId: string;
  /** 会话工作区内相对路径（不含开头斜杠） */
  relativePath: string;
}

export interface SandboxExternalPath {
  /** 外部文件锚定的目标根目录（沙箱家目录，供 customTargetDir 使用） */
  targetDir: string;
  /** 相对 targetDir 的路径（不含开头斜杠） */
  relativePath: string;
}

/**
 * 解析沙箱绝对路径 → { 会话ID, 相对路径 }。
 * 会话段必须为数字（与渲染层 isConversationSandboxPath 同口径）：
 * 非沙箱家目录前缀（如 /etc/hosts）、缺会话 ID 段或缺相对路径、
 * 含 `..` 越界段时返回 null，由调用方提示打开失败。
 */
export function parseSandboxAbsolutePath(
  target: string,
): SandboxAbsolutePath | null {
  if (!target || !target.startsWith(SANDBOX_HOME_PREFIX)) {
    return null;
  }
  const rest = target.slice(SANDBOX_HOME_PREFIX.length);
  const slashIndex = rest.indexOf('/');
  if (slashIndex <= 0 || slashIndex === rest.length - 1) {
    return null;
  }
  const conversationId = rest.slice(0, slashIndex);
  if (!/^\d+$/.test(conversationId)) {
    return null;
  }
  const relativePath = rest.slice(slashIndex + 1).replace(/\/+$/, '');
  if (!relativePath) {
    return null;
  }
  if (relativePath.split('/').includes('..')) {
    return null;
  }
  return { conversationId, relativePath };
}

/**
 * 解析工作区之外的沙箱家目录文件（如桌面 /home/user/Desktop/a.md）。
 * 锚定沙箱家目录 /home/user，保留完整相对结构；含 `..` 越界段时返回 null。
 */
export function parseSandboxExternalPath(
  target: string,
): SandboxExternalPath | null {
  if (!target || !target.startsWith(SANDBOX_HOME_PREFIX)) {
    return null;
  }
  const rest = target.slice(SANDBOX_HOME_PREFIX.length).replace(/\/+$/, '');
  if (!rest || !rest.includes('/')) {
    return null;
  }
  if (rest.split('/').includes('..')) {
    return null;
  }
  return {
    targetDir: SANDBOX_HOME_PREFIX.replace(/\/$/, ''),
    relativePath: rest,
  };
}

export type SandboxFileOpenDecision =
  | { type: 'open'; relativePath: string }
  /** 工作区之外的沙箱家目录文件（桌面等），走 customTargetDir 独立预览 */
  | { type: 'open-external'; targetDir: string; relativePath: string }
  | {
      type: 'reject';
      reason: 'unsupported-path' | 'not-in-conversation';
    };

/**
 * 会话内点击文件路径的打开判定：
 * - 当前会话工作区内（数字段匹配）→ open；
 * - 数字段不匹配（其他会话的沙箱路径）→ 拒绝 not-in-conversation
 *   （有意安全门：防跨会话越权，sandboxPath.test.ts 有锚定，勿按注释放开）；
 * - 沙箱家目录下非会话段路径（open-external 锚）→ open-external；
 * - 家目录之外/无法解析 → 拒绝（由调用方映射提示词条）。
 */
export function resolveSandboxFileOpen(
  target: string,
  currentConversationId: string | number | undefined,
): SandboxFileOpenDecision {
  const parsed = parseSandboxAbsolutePath(target);
  if (parsed) {
    if (parsed.conversationId !== String(currentConversationId ?? '')) {
      return { type: 'reject', reason: 'not-in-conversation' };
    }
    return { type: 'open', relativePath: parsed.relativePath };
  }
  const external = parseSandboxExternalPath(target);
  if (external) {
    return { type: 'open-external', ...external };
  }
  return { type: 'reject', reason: 'unsupported-path' };
}
