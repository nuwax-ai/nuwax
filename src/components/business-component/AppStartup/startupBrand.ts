import defaultLogoUrl from '@/assets/images/logo.png';

export interface StartupBrand {
  name: string;
  logoUrl: string;
  fallbackLetter: string;
}

const DEFAULT_BRAND_NAME = 'Nuwax';

/**
 * 租户配置本地缓存 Key。
 * 严禁从 '@/constants/home.constants' 导入该常量，
 * 避免提前触发 i18nRuntime 依赖链导致的循环初始化。
 */
const TENANT_CONFIG_STORAGE_KEY = 'TENANT_CONFIG_INFO';

/**
 * 启动界面仅读取本地同步配置（localStorage 租户缓存或宿主桥），
 * 绝不在首屏发起异步网络请求或依赖未初始化的 i18n/Model。
 */
export function getStartupBrand(): StartupBrand {
  let name = '';
  let logoUrl = '';

  // 1. 优先读取多租户本地缓存（系统配置中设置的品牌名和 Logo）
  try {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(TENANT_CONFIG_STORAGE_KEY)
        : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.siteName === 'string' && parsed.siteName.trim()) {
        name = parsed.siteName.trim();
      }
      if (typeof parsed?.siteLogo === 'string' && parsed.siteLogo.trim()) {
        logoUrl = parsed.siteLogo.trim();
      }
    }
  } catch {
    // 存储不可用或 JSON 解析异常降级
  }

  // 2. 次选桌面宿主桥（如桌面客户端配置的显示名）
  if (!name && typeof window !== 'undefined') {
    try {
      const bridge = (window as any).NuwaClawBridge;
      if (typeof bridge?.host?.getDisplayName === 'function') {
        const hostDisplayName = bridge.host.getDisplayName();
        if (typeof hostDisplayName === 'string' && hostDisplayName.trim()) {
          name = hostDisplayName.trim();
        }
      }
      if (!name) {
        const product = bridge?.host?.getProduct?.();
        if (product === 'nuwaclaw') {
          name = 'NuwaClaw';
        }
      }
    } catch {
      // 桥不可用降级
    }
  }

  const effectiveName = name || DEFAULT_BRAND_NAME;
  const effectiveLogo = logoUrl || defaultLogoUrl;
  const fallbackLetter = effectiveName[0]?.toUpperCase() || 'N';

  return {
    name: effectiveName,
    logoUrl: effectiveLogo,
    fallbackLetter,
  };
}
