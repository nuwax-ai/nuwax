/**
 * 用量统计页 Token 字段业务计算（与模型监控一致）
 *
 * 汇总（StatGroup）无「总输入」字段：
 * - totalInputTokens：输入 Token（不含缓存）
 * - totalCacheInputTokens：缓存输入 Token
 * - 总输入 Token（展示用）= totalInputTokens + totalCacheInputTokens
 *
 * 明细（ResourceStatDTO）：
 * - inputTokens：输入 Token（不含缓存）
 * - cacheInputTokens：缓存输入 Token
 * - 总输入 Token = inputTokens + cacheInputTokens
 */
import type {
  ResourceStatDTO,
  StatGroup,
} from '@/types/interfaces/systemManage';
import { sumBigNumbers, type NumericInput } from '@/utils/bigNumber';

type UsageStatGroupFields = Pick<
  StatGroup,
  'totalInputTokens' | 'totalCacheInputTokens'
>;

type UsageStatRecordFields = Pick<
  ResourceStatDTO,
  'inputTokens' | 'cacheInputTokens'
>;

/** 汇总：总输入 Token（含缓存）= 输入 + 缓存 */
export const getUsageSummaryTotalInputTokens = (
  group?: UsageStatGroupFields | null,
): NumericInput =>
  sumBigNumbers(
    group?.totalInputTokens,
    group?.totalCacheInputTokens,
  ).toString();

/** 汇总：输入 Token（不含缓存），使用 totalInputTokens 字段 */
export const getUsageSummaryInputTokens = (
  group?: UsageStatGroupFields | null,
): NumericInput => group?.totalInputTokens ?? 0;

/** 明细行：总输入 Token（含缓存）= 输入 + 缓存 */
export const getUsageRecordTotalInputTokens = (
  record?: UsageStatRecordFields | null,
): NumericInput =>
  sumBigNumbers(record?.inputTokens, record?.cacheInputTokens).toString();

/** 明细行：输入 Token（不含缓存） */
export const getUsageRecordInputTokens = (
  record?: UsageStatRecordFields | null,
): NumericInput => record?.inputTokens ?? 0;
