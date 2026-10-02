/** 工作区布局与再次点击后的回退位置；服务启动、环境切换仍由页面编排。 */
export const APP_DEV_WORKSPACE_DEFINITIONS = {
  files: {
    paneClasses: ['workspace-pane'],
    returnView: null,
    keepMounted: true,
  },
  'app-preview': {
    paneClasses: ['tool-workspace'],
    returnView: null,
    keepMounted: true,
  },
  database: {
    paneClasses: ['tool-workspace', 'tool-workspace-scroll'],
    returnView: 'app-preview',
    keepMounted: true,
  },
  'remote-desktop': {
    paneClasses: ['tool-workspace'],
    returnView: 'files',
    keepMounted: false,
  },
} as const;

export type AppDevWorkspaceView = keyof typeof APP_DEV_WORKSPACE_DEFINITIONS;

/** 固定渲染顺序让文件、应用与数据库保持原有挂载关系。 */
export const APP_DEV_WORKSPACE_ORDER = Object.keys(
  APP_DEV_WORKSPACE_DEFINITIONS,
) as AppDevWorkspaceView[];
