/**
 * AppDev 页面相关常量定义
 */

import type { ChatMessage } from '@/types/interfaces/appDev';

/**
 * 聊天相关常量
 */
export const CHAT_CONSTANTS = {
  DEFAULT_MESSAGES: [
    {
      id: '1',
      type: 'ai' as const,
      content:
        '你好！我是AI助手，可以帮你进行代码开发、问题解答等。有什么可以帮助你的吗？',
      timestamp: new Date(),
    },
  ] as ChatMessage[],
  DEFAULT_USER_ID: 'app-dev-user',
  MODEL_NAME: 'deepseek-v3',
  SSE_HEARTBEAT_INTERVAL: 30000, // 30秒
  REQUEST_ID_PREFIX: 'req_',
  SESSION_ID_PREFIX: 'session_',
} as const;

/**
 * 文件相关常量
 */
export const FILE_CONSTANTS = {
  IMAGE_EXTENSIONS: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'svg',
    'ico',
    'tiff',
  ],
  IGNORED_FILE_PATTERNS: [
    /^\./, // 以 . 开头的隐藏文件
    /^\.DS_Store$/,
    /^Thumbs\.db$/,
    /\.tmp$/,
    /\.bak$/,
  ],
  DEFAULT_FILE_LANGUAGE: 'Plain Text',
  FALLBACK_SIZE: 0,
  TREE_ROOT_LEVEL: 0,
  INDENT_SIZE: 16,
  REQUEST_ID_PREFIX: 'req_',
  SESSION_ID_PREFIX: 'session_',
} as const;

/**
 * 开发服务器相关常量
 */
export const DEV_SERVER_CONSTANTS = {
  DEFAULT_PORT_RANGE: [3000, 4000] as [number, number],
  STATUS_MESSAGES: {
    STARTING: '正在启动开发环境...',
    RUNNING: '开发环境运行中',
    STOPPED: '开发环境已停止',
    ERROR: '开发环境启动失败',
  },
  API_TIMEOUT: 10000, // 10秒
  SSE_HEARTBEAT_INTERVAL: 30000, // 30秒
} as const;

/**
 * UI 相关常量
 */
export const UI_CONSTANTS = {
  MODAL_WIDTHS: {
    UPLOAD_PROJECT: 500,
    UPLOAD_SINGLE_FILE: 500,
  },
  LOADING_MESSAGES: {
    FILE_CONTENT: '正在加载文件内容...',
    FILE_TREE: '正在加载文件树...',
    UPLOADING: '正在上传文件...',
  },
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  PRELOAD_DELAY: 1000,
} as const;

/**
 * 编辑器相关常量
 */
export const EDITOR_CONSTANTS = {
  DEFAULT_SETTINGS: {
    theme: 'light' as 'light' | 'dark',
    fontSize: 14,
    tabSize: 2,
  },
  MONACO_OPTIONS: {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
  },
} as const;

/**
 * 键盘快捷键常量
 */
export const KEYBOARD_SHORTCUTS = {
  SEND_MESSAGE: 'Enter',
  SAVE_FILE: 's',
  RESTART_DEV: 'r',
  MODIFIER_KEYS: {
    CTRL: 'ctrlKey',
    META: 'metaKey',
  },
} as const;

/**
 * 版本相关常量
 */
export const VERSION_CONSTANTS = {
  AVAILABLE_VERSIONS: ['v1', 'v2', 'v3', 'v4', 'v5'],
  DEFAULT_VERSION: 'v4',
  READ_ONLY_MESSAGE: '旧版本为只读模式。恢复或切换到最新版本以进行编辑。',
  PREVIEW_DISABLED_MESSAGE: '版本预览模式下无法查看页面预览',
} as const;

/**
 * 上传文件类型限制
 */
export const UPLOAD_CONSTANTS = {
  ALLOWED_PROJECT_TYPES: ['.zip', '.tar.gz', '.rar'],
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  NO_PROJECT_ID: '请先创建或选择项目',
  EMPTY_FILE_PATH: '请输入文件路径',
  NO_FILE_SELECTED: '请选择文件',
  UPLOAD_FAILED: '上传失败',
  LOAD_FILE_FAILED: '加载文件失败',
  SAVE_FILE_FAILED: '保存文件失败',
  DEV_SERVER_START_FAILED: '开发环境启动失败',
  CHAT_SEND_FAILED: '发送消息失败',
} as const;

/**
 * 成功消息常量
 */
export const SUCCESS_MESSAGES = {
  FILE_SAVED: '文件已保存',
  FILE_UPLOADED: '文件上传成功',
  PROJECT_UPLOADED: '项目上传并启动成功',
  DEV_SERVER_STARTED: '开发环境启动成功',
  CHAT_CANCELLED: '已取消AI任务',
} as const;
