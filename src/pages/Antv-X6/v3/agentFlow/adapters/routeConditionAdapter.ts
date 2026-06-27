/**
 * 路由决策分支条件适配
 *
 * RouteDecision 的 intentConfigs 直接使用结构化 conditionArgs（多条件，AND/OR 连接），
 * 对齐条件节点。不再保留 condition 字符串字段。
 *
 * 末尾固定一条「其他意图」兜底分支（intentType:'OTHER'）：不可删、始终在最后、无条件匹配。
 */

import type { BindConfigWithSub } from '@/types/interfaces/common';
import type { ConditionArgs } from '@/types/interfaces/node';
import { v4 as uuidv4 } from 'uuid';

/** 创建空的条件匹配项（左值=变量 Reference，右值=字面值 Input） */
export function createEmptyConditionArg(): ConditionArgs {
  return {
    compareType: 'EQUAL',
    firstArg: {
      bindValue: '',
      bindValueType: 'Reference',
      name: '',
    } as BindConfigWithSub,
    secondArg: {
      bindValue: '',
      bindValueType: 'Input',
      name: '',
    } as BindConfigWithSub,
  };
}

/** 创建「其他意图」兜底分支（intentType:OTHER，无条件匹配） */
export function createOtherIntentBranch(): Record<string, any> {
  return {
    uuid: uuidv4(),
    name: '其他意图',
    intent: '',
    intentType: 'OTHER',
    conditionArgs: [],
    conditionType: 'AND',
    nextNodeIds: [],
  };
}

/**
 * 加载时归一化 intentConfigs：
 * - 字段对齐：旧 intent→name（分支名）、旧 description→intent（描述）
 * - 移除废弃字段：expression / condition
 * - intentType 规范化：仅 'OTHER'（兜底）/ 'NORMAL'（用户分支）两种；历史脏值统一归 NORMAL
 * - 非兜底分支确保有 conditionArgs、conditionType 默认 AND
 * - 末尾固定一条「其他意图」(intentType:OTHER) 兜底分支（缺失则补；多余则仅保留最后一条、其余降级 NORMAL）
 */
export function hydrateIntentConfigs(
  intentConfigs: Array<Record<string, any>> | undefined,
): Array<Record<string, any>> {
  if (!intentConfigs?.length) return [createOtherIntentBranch()];

  const mapped = intentConfigs.map((item) => {
    const isLegacy = item.description !== undefined;
    const name = isLegacy ? item.intent : item.name ?? '';
    const intent = isLegacy ? item.description : item.intent;
    const isOther = item.intentType === 'OTHER';
    const conditionArgs = isOther
      ? []
      : Array.isArray(item.conditionArgs) && item.conditionArgs.length
      ? item.conditionArgs
      : [createEmptyConditionArg()];
    return {
      uuid: item.uuid,
      nextNodeIds: item.nextNodeIds ?? [],
      name,
      intent,
      intentType: isOther ? 'OTHER' : 'NORMAL',
      conditionArgs,
      conditionType: item.conditionType === 'OR' ? 'OR' : 'AND',
    };
  });

  // 末尾仅保留一条 OTHER：其余 OTHER 降级为 NORMAL（留在原位）
  const lastOtherIdx = mapped.map((b) => b.intentType).lastIndexOf('OTHER');
  const normalized = mapped.map((b, i) =>
    b.intentType === 'OTHER' && i !== lastOtherIdx
      ? { ...b, intentType: 'NORMAL' }
      : b,
  );
  const otherBranch =
    lastOtherIdx >= 0 ? normalized[lastOtherIdx] : createOtherIntentBranch();
  const rest = normalized.filter((_, i) => i !== lastOtherIdx);
  return [...rest, { ...otherBranch, name: otherBranch.name || '其他意图' }];
}
