/**
 * 连接器管理 - 通用常量
 *
 * 从 index.tsx 抽出来，给详情抽屉复用：
 * - 鉴权方式筛选选项 / 值到中文标签映射
 * - 状态筛选选项
 *
 * 注意：放在 ConnectorManage 目录下（而不是全局 constants），
 * 是因为目前只有本页和详情抽屉使用，避免全局污染。
 */

/* 鉴权方式筛选选项（空串=全部） */
export const AUTH_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: '' },
  { label: '免鉴权', value: 'no_auth' },
  { label: 'Api Key', value: 'api_key' },
  { label: 'Bearer', value: 'bearer' },
  { label: 'Outh 2.0', value: 'oauth2' },
  { label: '扫描授权（设备码）', value: 'oauth2_device' },
  { label: '自定义', value: 'custom' },
];

/* 鉴权方式值到中文标签 */
export const AUTH_TYPE_LABEL_MAP: Record<string, string> = {
  no_auth: '免鉴权',
  api_key: 'Api Key',
  bearer: 'Bearer',
  oauth2: 'Outh 2.0',
  oauth2_device: '扫描授权（设备码）',
  custom: '自定义',
};

/* 鉴权方式 → 列表 Tag 颜色（antd 预设色，未知类型兜底 default；
   管理侧 / 空间侧两处列表共用，写法同 ConnectorImportDrawer 的 OP_COLOR_MAP） */
export const AUTH_TYPE_COLOR_MAP: Record<string, string> = {
  no_auth: 'default',
  api_key: 'gold',
  bearer: 'geekblue',
  oauth2: 'purple',
  oauth2_device: 'magenta',
  custom: 'cyan',
};

/* 状态筛选选项（空串=全部） */
export const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: '' },
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];

/* 连接状态筛选选项（管理侧筛选器与空间侧 connected 参数共用） */
export const CONNECTED_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '已连接', value: 'true' },
  { label: '未连接', value: 'false' },
];
