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

/**
 * 解析沙箱绝对路径 → { 会话ID, 相对路径 }。
 * 会话段必须为数字（与渲染层 isConversationSandboxPath 同口径）：
 * 非沙箱家目录前缀（如 /home/user/Desktop/…）、缺会话 ID 段或缺相对路径、
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

export type SandboxFileOpenDecision =
  | { type: 'open'; relativePath: string }
  | {
      type: 'reject';
      reason: 'unsupported-path' | 'not-in-conversation';
    };

/**
 * 会话内点击文件路径的打开判定：沙箱路径且属于当前会话才放行，
 * 其余给出拒绝原因（由调用方映射提示词条）。
 */
export function resolveSandboxFileOpen(
  target: string,
  currentConversationId: string | number | undefined,
): SandboxFileOpenDecision {
  const parsed = parseSandboxAbsolutePath(target);
  if (!parsed) {
    return { type: 'reject', reason: 'unsupported-path' };
  }
  if (parsed.conversationId !== String(currentConversationId ?? '')) {
    return { type: 'reject', reason: 'not-in-conversation' };
  }
  return { type: 'open', relativePath: parsed.relativePath };
}
