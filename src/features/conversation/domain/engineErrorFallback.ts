/**
 * 引擎内部错误 → 用户态兜底文案（NW-108）。
 *
 * @智能体会话里引擎尚未就绪/未初始化的内部错误（如 "AcpEngine not initialized"）
 * 会以后端拼好的形态直达消息流：包成 Markdown 代码块的 assistant 正文，或工具
 * result 的纯文本输出。这类字符串对用户毫无信息量，渲染层要在出口处换成可读
 * 兜底文案，不能把内部错误裸输出成「回复代码块」。
 *
 * 匹配口径刻意收窄为「整段就是一条引擎内部错误」：剥掉包住整段的最外层代码
 * fence 后须与已知错误整句对齐；正文里顺带提到这些词的正常回答不受影响。
 *
 * 纯函数模块：不 import umi/services（vitest 仓内约束），兜底文案由调用方
 * （渲染层，带 dict）注入。
 */

/** 已知引擎内部错误整句（大小写不敏感；命中即替换为用户态文案） */
const ENGINE_INTERNAL_ERROR_PATTERNS: RegExp[] = [
  // ACP 引擎未初始化（桌面端 @智能体「笔助」实测，NW-108）
  /^acp\s*engine\s+not\s+initialized\.?$/i,
  // 同族兜底：任意「XXEngine not initialized」内部错误，避免逐个引擎补正则
  /^[a-z0-9_.]+\s*engine\s+not\s+initialized\.?$/i,
];

/** 剥掉包住整段结果的 Markdown code fence（正文内部 fence 保留） */
const stripOuterCodeFence = (value: string): string => {
  const trimmed = value.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return (match?.[1] ?? trimmed).trim();
};

/** 整段文本是否就是一条引擎内部错误（含代码 fence 包裹形态） */
export function isEngineInternalErrorText(
  text: string | null | undefined,
): boolean {
  if (!text) return false;
  const stripped = stripOuterCodeFence(text);
  if (!stripped) return false;
  return ENGINE_INTERNAL_ERROR_PATTERNS.some((pattern) =>
    pattern.test(stripped),
  );
}

/**
 * 引擎内部错误 → 兜底文案；非命中文本原样返回（null 语义区分见 isXxx）。
 * 返回值恒非空字符串：命中给 fallback，未命中回原文。
 */
export function mapEngineInternalErrorText(
  text: string | null | undefined,
  fallbackText: string,
): string {
  if (isEngineInternalErrorText(text)) {
    return fallbackText;
  }
  return text ?? '';
}
