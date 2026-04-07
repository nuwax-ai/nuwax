/**
 * 多语言系统同步入口
 *
 * 已废弃：请使用 @/utils/i18nAdapters 中的 syncAllLocaleSystems()
 * 本文件保留仅为向后兼容，内部直接代理到 i18nAdapters
 */
export { syncAllLocaleSystems as syncLocaleSystems } from './i18nAdapters';
