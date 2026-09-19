/**
 * 连接器管理 - 通用常量
 *
 * 从 index.tsx 抽出来，给详情抽屉复用：
 * - 鉴权方式筛选选项 / 值到标签映射
 * - 状态筛选选项
 *
 * 带文案的选项/映射一律函数式导出（调用时经 dict 取词，语言切换即时
 * 生效，也不受模块加载早于 i18n 初始化的时序影响）。
 *
 * 注意：放在 ConnectorManage 目录下（而不是全局 constants），
 * 是因为目前只有本页和详情抽屉使用，避免全局污染。
 */

import { dict } from '@/services/i18nRuntime';

/* 鉴权方式筛选选项（空串=全部） */
export const getAuthTypeOptions = (): Array<{
  label: string;
  value: string;
}> => [
  { label: dict('PC.Common.Global.all'), value: '' },
  { label: dict('PC.Pages.ConnectorManage.authNoAuth'), value: 'no_auth' },
  { label: 'Api Key', value: 'api_key' },
  { label: 'Bearer', value: 'bearer' },
  { label: 'Outh 2.0', value: 'oauth2' },
  {
    label: dict('PC.Pages.ConnectorManage.authOauth2Device'),
    value: 'oauth2_device',
  },
  { label: dict('PC.Common.Global.custom'), value: 'custom' },
];

/* 鉴权方式值到标签 */
export const getAuthTypeLabelMap = (): Record<string, string> => ({
  no_auth: dict('PC.Pages.ConnectorManage.authNoAuth'),
  api_key: 'Api Key',
  bearer: 'Bearer',
  oauth2: 'Outh 2.0',
  oauth2_device: dict('PC.Pages.ConnectorManage.authOauth2Device'),
  custom: dict('PC.Common.Global.custom'),
});

/* 鉴权方式 → 列表 Tag 颜色（antd 预设色，未知类型兜底 default；
   管理侧 / 空间侧两处列表共用，写法同 ConnectorImportDrawer 的 OP_COLOR_MAP；
   纯色值无文案，保持模块级导出） */
export const AUTH_TYPE_COLOR_MAP: Record<string, string> = {
  no_auth: 'default',
  api_key: 'gold',
  bearer: 'geekblue',
  oauth2: 'purple',
  oauth2_device: 'magenta',
  custom: 'cyan',
};

/* 状态筛选选项（空串=全部） */
export const getStatusOptions = (): Array<{
  label: string;
  value: string;
}> => [
  { label: dict('PC.Common.Global.all'), value: '' },
  { label: dict('PC.Pages.ConnectorManage.statusEnabled'), value: 'enabled' },
  {
    label: dict('PC.Pages.ConnectorManage.statusDisabled'),
    value: 'disabled',
  },
];

/* 连接状态筛选选项（管理侧筛选器与空间侧 connected 参数共用） */
export const getConnectedOptions = (): Array<{
  label: string;
  value: string;
}> => [
  { label: dict('PC.Components.CapabilityModal.connected'), value: 'true' },
  { label: dict('PC.Components.CapabilityModal.disconnected'), value: 'false' },
];
