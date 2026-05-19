import type { StatGroup } from '@/types/interfaces/systemManage';
import {
  subtractBigNumbers,
  sumBigNumbers,
  type NumericInput,
} from './bigNumber';

type StatGroupTokenFields = Pick<
  StatGroup,
  'totalInputTokens' | 'totalCacheInputTokens' | 'inputTokens'
>;

/**
 * 汇总 Token 字段语义
 * - totalIncludesCache：totalInputTokens 为总输入（含缓存），输入 = 总输入 - 缓存（用量统计）
 * - totalIsInputOnly：totalInputTokens 为输入 Token（不含缓存），总输入 = 输入 + 缓存（模型监控）
 */
export type StatGroupTokenMode = 'totalIncludesCache' | 'totalIsInputOnly';

/**
 * 输入 Token（不含缓存）
 */
export const getStatGroupInputTokens = (
  group?: StatGroupTokenFields | null,
  mode: StatGroupTokenMode = 'totalIncludesCache',
): NumericInput => {
  if (group?.inputTokens !== null && group?.inputTokens !== undefined) {
    return group.inputTokens;
  }
  if (mode === 'totalIsInputOnly') {
    return group?.totalInputTokens ?? 0;
  }
  return subtractBigNumbers(
    group?.totalInputTokens,
    group?.totalCacheInputTokens,
  ).toString();
};

/**
 * 总输入 Token（含缓存）
 */
export const getStatGroupTotalInputTokens = (
  group?: StatGroupTokenFields | null,
  mode: StatGroupTokenMode = 'totalIncludesCache',
): NumericInput => {
  if (mode === 'totalIsInputOnly') {
    return sumBigNumbers(group?.totalInputTokens, group?.totalCacheInputTokens);
  }
  return group?.totalInputTokens ?? 0;
};
