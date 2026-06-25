/**
 * 路由决策分支条件：结构化 conditionArgs ↔ 后端 condition 字符串互转
 *
 * 后端契约：intentConfigs[].condition 为表达式字符串（如 {{userQuery}} contains 退货）
 * 前端 UI：用 conditionArgs[0] 承载「变量 + 运算符 + 值/变量」结构化编辑
 */

import type { BindConfigWithSub } from '@/types/interfaces/common';
import type { ConditionArgs } from '@/types/interfaces/node';

/** 运算符 → condition 字符串中的符号/关键字 */
const COMPARE_SYMBOL_MAP: Record<string, string> = {
  EQUAL: '==',
  NOT_EQUAL: '!=',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '<=',
  LENGTH_GREATER_THAN: 'length>',
  LENGTH_GREATER_THAN_OR_EQUAL: 'length>=',
  LENGTH_LESS_THAN: 'length<',
  LENGTH_LESS_THAN_OR_EQUAL: 'length<=',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not contains',
  MATCH_REGEX: 'matches',
  IS_NULL: 'is null',
  NOT_NULL: 'is not null',
};

const TEXT_KEYWORD_OPS = new Set([
  'CONTAINS',
  'NOT_CONTAINS',
  'MATCH_REGEX',
  'IS_NULL',
  'NOT_NULL',
]);

/** 创建空的条件匹配项（单条） */
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

/**
 * 将引用参数格式化为 {{name}} 形式
 */
function formatReferenceToken(
  arg: BindConfigWithSub | null | undefined,
  argMap?: Record<string, BindConfigWithSub>,
): string {
  if (!arg?.bindValue) return '';
  const mapped = argMap?.[arg.bindValue];
  const name = arg.name || mapped?.name || arg.bindValue;
  return `{{${name}}}`;
}

/**
 * 格式化比较右侧：Input 为字面值，Reference 为 {{name}}
 */
function formatRightOperand(
  arg: BindConfigWithSub | null | undefined,
  argMap?: Record<string, BindConfigWithSub>,
): string {
  if (!arg?.bindValue) return '';
  if (arg.bindValueType === 'Reference') {
    return formatReferenceToken(arg, argMap);
  }
  return String(arg.bindValue).trim();
}

/**
 * conditionArgs → condition 字符串（保存给后端）
 */
export function serializeConditionArg(
  conditionArgs: ConditionArgs[] | undefined,
  argMap?: Record<string, BindConfigWithSub>,
): string {
  const item = conditionArgs?.[0];
  if (!item?.firstArg?.bindValue) return '';

  const left = formatReferenceToken(item.firstArg, argMap);
  const compareType = item.compareType || 'EQUAL';
  const opToken = COMPARE_SYMBOL_MAP[compareType] || '==';

  if (compareType === 'IS_NULL' || compareType === 'NOT_NULL') {
    return `${left} ${opToken}`.trim();
  }

  const right = formatRightOperand(item.secondArg, argMap);
  if (!right) return '';

  if (TEXT_KEYWORD_OPS.has(compareType)) {
    return `${left} ${opToken} ${right}`;
  }
  return `${left} ${opToken} ${right}`;
}

/**
 * 从已有 condition 字符串粗解析为 conditionArgs（加载历史数据）
 * 无法解析时返回默认空结构
 */
export function parseConditionToConditionArgs(
  condition?: string,
): ConditionArgs[] {
  const empty = createEmptyConditionArg();
  const text = condition?.trim();
  if (!text) return [empty];

  const nullMatch = text.match(/^\{\{([^}]+)\}\}\s+(is null|is not null)$/i);
  if (nullMatch) {
    return [
      {
        compareType:
          nullMatch[2].toLowerCase() === 'is null' ? 'IS_NULL' : 'NOT_NULL',
        firstArg: {
          bindValue: '',
          bindValueType: 'Reference',
          name: nullMatch[1].trim(),
        } as BindConfigWithSub,
        secondArg: null,
      },
    ];
  }

  const keywordMatch = text.match(
    /^\{\{([^}]+)\}\}\s+(contains|not contains|matches)\s+(.+)$/i,
  );
  if (keywordMatch) {
    const opKey = keywordMatch[2].toLowerCase();
    const compareType =
      opKey === 'contains'
        ? 'CONTAINS'
        : opKey === 'not contains'
        ? 'NOT_CONTAINS'
        : 'MATCH_REGEX';
    return [
      {
        compareType,
        firstArg: {
          bindValue: '',
          bindValueType: 'Reference',
          name: keywordMatch[1].trim(),
        } as BindConfigWithSub,
        secondArg: {
          bindValue: keywordMatch[3].trim(),
          bindValueType: 'Input',
          name: '',
        } as BindConfigWithSub,
      },
    ];
  }

  const symbolMatch = text.match(
    /^\{\{([^}]+)\}\}\s*(==|!=|>=|<=|>|<)\s*(.+)$/,
  );
  if (symbolMatch) {
    const op = symbolMatch[2];
    const rightRaw = symbolMatch[3].trim();
    const compareType =
      Object.entries(COMPARE_SYMBOL_MAP).find(([, v]) => v === op)?.[0] ||
      'EQUAL';
    const isRef = /^\{\{[^}]+\}\}$/.test(rightRaw);
    return [
      {
        compareType,
        firstArg: {
          bindValue: '',
          bindValueType: 'Reference',
          name: symbolMatch[1].trim(),
        } as BindConfigWithSub,
        secondArg: {
          bindValue: isRef ? rightRaw.slice(2, -2) : rightRaw,
          bindValueType: isRef ? 'Reference' : 'Input',
          name: isRef ? rightRaw.slice(2, -2) : '',
        } as BindConfigWithSub,
      },
    ];
  }

  return [empty];
}

/**
 * 根据变量展示名在 argMap 中反查 bindValue（加载解析后的回填）
 */
function resolveFirstArgBindValue(
  firstArg: BindConfigWithSub | null | undefined,
  argMap?: Record<string, BindConfigWithSub>,
): BindConfigWithSub | null | undefined {
  if (!firstArg || firstArg.bindValue || !firstArg.name || !argMap) {
    return firstArg;
  }
  const matched = Object.entries(argMap).find(
    ([, v]) => v?.name === firstArg.name,
  );
  if (!matched) return firstArg;
  return { ...firstArg, bindValue: matched[0] };
}

/**
 * 为 intentConfigs 补全 conditionArgs，并同步 condition 字段
 */
export function hydrateIntentConfigs(
  intentConfigs: Array<Record<string, any>> | undefined,
  argMap?: Record<string, BindConfigWithSub>,
): Array<Record<string, any>> {
  if (!intentConfigs?.length) return [];
  return intentConfigs.map((item) => {
    const conditionArgs = (
      item.conditionArgs?.length > 0
        ? item.conditionArgs
        : parseConditionToConditionArgs(item.condition)
    ).map((arg: ConditionArgs) => ({
      ...arg,
      firstArg: resolveFirstArgBindValue(arg.firstArg, argMap),
      secondArg:
        arg.secondArg?.bindValueType === 'Reference'
          ? resolveFirstArgBindValue(arg.secondArg, argMap)
          : arg.secondArg,
    }));
    const condition = serializeConditionArg(conditionArgs, argMap);
    return { ...item, conditionArgs, condition };
  });
}

/**
 * 同步单条分支的 condition 字段（表单编辑时调用）
 */
export function syncBranchConditionField(
  form: {
    getFieldValue: (n: any) => any;
    setFieldValue: (n: any, v: any) => void;
  },
  branchIndex: number,
  argMap?: Record<string, BindConfigWithSub>,
): void {
  const conditionArgs = form.getFieldValue([
    'intentConfigs',
    branchIndex,
    'conditionArgs',
  ]) as ConditionArgs[] | undefined;
  const condition = serializeConditionArg(conditionArgs, argMap);
  const prev = form.getFieldValue(['intentConfigs', branchIndex, 'condition']);
  if (prev !== condition) {
    form.setFieldValue(['intentConfigs', branchIndex, 'condition'], condition);
  }
}
