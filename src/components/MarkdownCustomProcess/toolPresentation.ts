import { AgentComponentTypeEnum } from '@/types/enums/agent';

/** 工具节点的视觉语义；只决定展示，不改变执行协议。 */
export type ToolPresentationKind =
  | 'terminal'
  | 'file-edit'
  | 'todo'
  | 'skill'
  | 'file-read'
  | 'search'
  | 'browser'
  | 'generic';

interface ToolPresentationInput {
  componentType?: AgentComponentTypeEnum | string;
  name?: string;
  result?: unknown;
}

const resultItems = (result: unknown): Array<Record<string, unknown>> => {
  if (!result || typeof result !== 'object') return [];
  const data = (result as { data?: unknown }).data;
  return Array.isArray(data)
    ? data.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === 'object',
      )
    : [];
};

/**
 * 协议结构优先、组件类型其次、名称启发式最后。
 * 名称仅用于选择图标/轻量版式；未命中时始终安全降级为 generic。
 */
export const getToolPresentationKind = ({
  componentType,
  name = '',
  result,
}: ToolPresentationInput): ToolPresentationKind => {
  const resultRecord =
    result && typeof result === 'object'
      ? (result as Record<string, unknown>)
      : undefined;
  const resultKind = resultRecord?.kind;
  const input =
    resultRecord?.input && typeof resultRecord.input === 'object'
      ? (resultRecord.input as Record<string, unknown>)
      : undefined;
  const items = resultItems(result);
  if (items.some((item) => item.type === 'terminal')) return 'terminal';
  if (items.some((item) => item.type === 'diff')) return 'file-edit';
  // 真实 ToolCall 历史协议使用 kind + content.text，而不是 terminal/diff data 项。
  if (resultKind === 'execute' || typeof input?.command === 'string') {
    return 'terminal';
  }
  if (resultKind === 'read') return 'file-read';
  if (resultKind === 'edit' || resultKind === 'write') return 'file-edit';

  if (componentType === AgentComponentTypeEnum.Plan) return 'todo';
  if (componentType === AgentComponentTypeEnum.Skill) return 'skill';
  if (componentType === AgentComponentTypeEnum.Knowledge) return 'search';
  if (
    componentType === AgentComponentTypeEnum.Page ||
    componentType === AgentComponentTypeEnum.PageApp
  ) {
    return 'browser';
  }

  const normalizedName = name.toLocaleLowerCase();
  if (/(读取|read\b|read_file|打开文件)/i.test(normalizedName)) {
    return 'file-read';
  }
  if (/(编辑|修改|写入|edit\b|write\b|apply_patch)/i.test(normalizedName)) {
    return 'file-edit';
  }
  if (/(待办|todo|task list|任务清单)/i.test(normalizedName)) return 'todo';
  if (/(搜索|检索|查询|查阅|search\b|query\b|find\b)/i.test(normalizedName)) {
    return 'search';
  }
  if (
    /(浏览器|网页|页面|browser\b|navigate\b|open page)/i.test(normalizedName)
  ) {
    return 'browser';
  }
  return 'generic';
};

/** 专属分支必须互斥，避免同一详情再落入通用兜底。 */
export const shouldRenderGenericDetails = (
  kind: ToolPresentationKind,
): boolean => !['terminal', 'file-edit', 'todo'].includes(kind);
