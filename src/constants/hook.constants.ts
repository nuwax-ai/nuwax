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
    http: { type: 'http', url: '' },
    mcp_tool: { type: 'mcp_tool', tool: '' },
    prompt: { type: 'prompt', prompt: '' },
  };
  return JSON.stringify(templates[type] ?? templates.command, null, 2);
};

/** Hook 启用状态 */
export const HOOK_STATUS_ENABLED = 1;
export const HOOK_STATUS_DISABLED = 0;
