/**
 * 能力类型图标 SVG 字符串（单源）
 *
 * @description
 * 供两处共用，保证视觉一致：
 * - CapabilityModal 左侧类型导航（RESOURCE_MENUS，React 渲染）
 * - MentionEditor 提及 chip（createMentionChip 命令式 DOM，innerHTML 注入）
 * 资料库图标为 @ant-design/icons FileTextOutlined 的等价 SVG
 * （antd 图标库无官方字符串出口；升级图标库版本时需人工比对形态）
 */

export const CAPABILITY_MENU_ICON_SVGS = {
  /** 技能：定制线性图标（stroke 跟随 currentColor） */
  skill:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 7 5-5 2 2-5 5M14 10l-4 4M8 13l3 3-5 5a2.1 2.1 0 0 1-3-3l5-5Z"/><path d="M9.5 8.5a4.5 4.5 0 0 0-5.7-6.1l2.7 2.7-1.4 1.4-2.7-2.7a4.5 4.5 0 0 0 6.1 5.7l6 6a4.5 4.5 0 0 0 5.7 6.1l-2.7-2.7 1.4-1.4 2.7 2.7a4.5 4.5 0 0 0-6.1-5.7l-6-6Z"/></svg>',
  /** 资料库：FileTextOutlined 同形（fill 跟随 currentColor，1em 随字号缩放） */
  knowledge:
    '<svg viewBox="64 64 896 896" focusable="false" data-icon="file-text" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494zM504 618H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM312 490v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8z"/></svg>',
} as const;
