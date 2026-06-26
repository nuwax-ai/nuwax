/** Hook 事件选项 */
export const HOOK_EVENT_OPTIONS = [
  { label: 'PreToolUse', value: 'PreToolUse' },
  { label: 'PostToolUse', value: 'PostToolUse' },
  { label: 'PostToolUseFailure', value: 'PostToolUseFailure' },
  { label: 'PostToolBatch', value: 'PostToolBatch' },
  { label: 'PermissionRequest', value: 'PermissionRequest' },
  { label: 'PermissionDenied', value: 'PermissionDenied' },
  { label: 'Stop', value: 'Stop' },
  { label: 'StopFailure', value: 'StopFailure' },
  { label: 'SessionStart', value: 'SessionStart' },
  { label: 'UserPromptSubmit', value: 'UserPromptSubmit' },
  { label: 'UserPromptExpansion', value: 'UserPromptExpansion' },
  { label: 'SubagentStart', value: 'SubagentStart' },
  { label: 'SubagentStop', value: 'SubagentStop' },
  { label: 'TaskCreated', value: 'TaskCreated' },
  { label: 'TaskCompleted', value: 'TaskCompleted' },
  { label: 'PreCompact', value: 'PreCompact' },
  { label: 'PostCompact', value: 'PostCompact' },
];

/** 匹配规则占位符类型 */
export enum HookMatcherPlaceholderType {
  /** 工具名称，如 Bash、Edit|Write、mcp... */
  ToolName = 'ToolName',
  /** 不支持匹配规则 */
  NotSupported = 'NotSupported',
  /** 错误类型，如 rate_limit、overloaded */
  StopFailure = 'StopFailure',
  /** 启动方式，如 startup、resume、clear、compact */
  SessionStart = 'SessionStart',
  /** Agent 类型，如 general-purpose、Explore、Plan */
  SubagentStart = 'SubagentStart',
}

/** 匹配规则字段配置 */
export interface HookMatcherFieldConfig {
  disabled: boolean;
  placeholderType: HookMatcherPlaceholderType;
}

/** 根据 Hook 事件获取匹配规则输入框配置 */
export const getHookMatcherFieldConfig = (
  event?: string,
): HookMatcherFieldConfig => {
  switch (event) {
    case 'PreToolUse':
    case 'PostToolUse':
    case 'PostToolUseFailure':
    case 'PermissionRequest':
    case 'PermissionDenied':
      return {
        disabled: false,
        placeholderType: HookMatcherPlaceholderType.ToolName,
      };
    case 'StopFailure':
      return {
        disabled: false,
        placeholderType: HookMatcherPlaceholderType.StopFailure,
      };
    case 'SessionStart':
      return {
        disabled: false,
        placeholderType: HookMatcherPlaceholderType.SessionStart,
      };
    case 'SubagentStart':
      return {
        disabled: false,
        placeholderType: HookMatcherPlaceholderType.SubagentStart,
      };
    case 'PostToolBatch':
    case 'Stop':
    case 'UserPromptSubmit':
    case 'UserPromptExpansion':
    case 'SubagentStop':
    case 'TaskCreated':
    case 'TaskCompleted':
    case 'PreCompact':
    case 'PostCompact':
      return {
        disabled: true,
        placeholderType: HookMatcherPlaceholderType.NotSupported,
      };
    default:
      return {
        disabled: false,
        placeholderType: HookMatcherPlaceholderType.ToolName,
      };
  }
};

/** Hook 类型选项 */
export const HOOK_TYPE_OPTIONS = [
  { label: 'command', value: 'command' },
  { label: 'http', value: 'http' },
  { label: 'mcp_tool', value: 'mcp_tool' },
  { label: 'prompt', value: 'prompt' },
];

/** 按类型生成默认配置 JSON */
export const getDefaultHookConfigJson = (type: string): string => {
  const templates: Record<string, object> = {
    command: { type: 'command', command: '', args: [] },
    http: { type: 'http', url: '', timeout: 30 },
    mcp_tool: { type: 'mcp_tool', server: '', tool: '', input: {} },
    prompt: { type: 'prompt', prompt: '' },
  };
  return JSON.stringify(templates[type] ?? templates.command, null, 2);
};
