interface PreviewToolDefinition {
  titleKey: string;
  descriptionKey: string;
  /** 激活时是否收起文件预览侧栏；终端仍由底部控制台承载。 */
  filePreview: 'open' | 'close';
  content: 'workspace' | 'placeholder';
}

/** 工具的标题、占位与激活策略在此维护，页签状态仍由 usePreviewTabs 管理。 */
export const PREVIEW_TOOL_DEFINITIONS = {
  preview: {
    titleKey: 'PC.Pages.AppDevPro.appPreview',
    descriptionKey: 'PC.Pages.ConversationAgentTabPicker.previewDesc',
    filePreview: 'close',
    content: 'workspace',
  },
  arrange: {
    titleKey: 'PC.Pages.ConversationAgentTabPicker.arrange',
    descriptionKey: 'PC.Pages.ConversationAgentTabPicker.arrangeDesc',
    filePreview: 'open',
    content: 'placeholder',
  },
  terminal: {
    titleKey: 'PC.Pages.ConversationAgentTabPicker.terminal',
    descriptionKey: 'PC.Pages.ConversationAgentTabPicker.terminalDesc',
    filePreview: 'open',
    content: 'placeholder',
  },
  'version-control': {
    titleKey: 'PC.Pages.ConversationAgentTabPicker.versionControl',
    descriptionKey: 'PC.Pages.ConversationAgentTabPicker.versionControlDesc',
    filePreview: 'close',
    content: 'workspace',
  },
  'subscription-setting': {
    titleKey: 'PC.Pages.ConversationAgentTabPicker.subscriptionSetting',
    descriptionKey:
      'PC.Pages.ConversationAgentTabPicker.subscriptionSettingDesc',
    filePreview: 'open',
    content: 'placeholder',
  },
  'subscription-stats': {
    titleKey: 'PC.Pages.ConversationAgentTabPicker.subscriptionStats',
    descriptionKey: 'PC.Pages.ConversationAgentTabPicker.subscriptionStatsDesc',
    filePreview: 'open',
    content: 'placeholder',
  },
  database: {
    titleKey: 'PC.Pages.AppDevPro.database',
    descriptionKey: 'PC.Pages.AppDevPro.databaseDesc',
    filePreview: 'close',
    content: 'workspace',
  },
  'database-config': {
    titleKey: 'PC.Pages.AppDevPro.databaseConfig',
    descriptionKey: 'PC.Pages.AppDevPro.databaseConfigDesc',
    filePreview: 'close',
    content: 'workspace',
  },
  'remote-desktop': {
    titleKey: 'PC.Pages.AppDevPro.remoteDesktop',
    descriptionKey: 'PC.Pages.AppDevPro.remoteDesktopDesc',
    filePreview: 'open',
    content: 'placeholder',
  },
} as const satisfies Record<string, PreviewToolDefinition>;

export type PreviewToolId = keyof typeof PREVIEW_TOOL_DEFINITIONS;
