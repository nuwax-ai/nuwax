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
  { label: '自定义', value: 'custom' },
];

/* 鉴权方式值到中文标签 */
export const AUTH_TYPE_LABEL_MAP: Record<string, string> = {
  no_auth: '免鉴权',
  api_key: 'Api Key',
  bearer: 'Bearer',
  oauth2: 'Outh 2.0',
  custom: '自定义',
};

/* 状态筛选选项（空串=全部） */
export const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: '' },
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];
