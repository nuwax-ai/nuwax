/**
 * .gitignore 追加条目的写前决策（纯函数）。
 * 拉取三态与 services/skill.ts 的 ContentFetchOutcome 结构一致，
 * 此处独立声明以保持本模块零依赖、可直接被 vitest 测试。
 */
export type GitignoreContentOutcome =
  | { status: 'ok'; content: string }
  | { status: 'missing' }
  | { status: 'error' };

export type GitignoreWritePlan =
  | { action: 'skip-duplicate' }
  | { action: 'abort-fetch-error' }
  | { action: 'write'; operation: 'create' | 'modify'; contents: string };

/**
 * 依据 .gitignore 现内容的三态拉取结果决定写入方式：
 * - 拉取失败 → 中止（modify 基于空串会覆写整个文件；create 撞上已存在文件会被
 *   file-server 静默跳过，形成「提示成功、实际未写入」的假成功）
 * - 文件存在（含空文件）→ 一律 modify 整文件覆写为追加后的内容
 * - 文件不存在（404）→ create，内容补尾换行
 */
export function resolveGitignoreWritePlan(
  outcome: GitignoreContentOutcome,
  fileId: string,
): GitignoreWritePlan {
  const entry = fileId.startsWith('/') ? fileId.slice(1) : fileId;

  if (outcome.status === 'error') {
    return { action: 'abort-fetch-error' };
  }

  if (outcome.status === 'ok') {
    const duplicate = outcome.content
      .split('\n')
      .some((line: string) => line.trim() === entry || line.trim() === fileId);
    if (duplicate) {
      return { action: 'skip-duplicate' };
    }
    return {
      action: 'write',
      operation: 'modify',
      contents: outcome.content
        ? `${outcome.content.replace(/\n$/, '')}\n${entry}`
        : entry,
    };
  }

  return {
    action: 'write',
    operation: 'create',
    contents: `${entry}\n`,
  };
}
