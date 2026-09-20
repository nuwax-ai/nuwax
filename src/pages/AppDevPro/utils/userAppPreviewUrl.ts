import { UserAppDbEnvEnum } from '../services/appDb';
import {
  normalizeUserAppPreviewUrl,
  UserAppDomainTypeEnum,
  type UserAppDomainInfo,
} from '../services/appDomain';

/**
 * 按当前环境从域名列表取开发或线上域名。
 *
 * @param env 当前环境（开发 / 线上）
 * @param domains 应用绑定的域名列表
 * @returns 匹配到的域名；没有则返回空字符串
 */
export const pickUserAppEnvDomain = (
  env: UserAppDbEnvEnum,
  domains?: UserAppDomainInfo[],
): string => {
  const domainType =
    env === UserAppDbEnvEnum.Prod
      ? UserAppDomainTypeEnum.Prod
      : UserAppDomainTypeEnum.Dev;
  return domains?.find((item) => item.domainType === domainType)?.domain || '';
};

/**
 * 应用预览地址：直接使用当前环境域名。
 *
 * @param domain 当前环境对应的开发或线上域名
 * @returns 可嵌入 iframe 的地址；缺少域名时返回空字符串
 */
export const getUserAppAppProxyUrl = (domain?: string): string => {
  return normalizeUserAppPreviewUrl(domain);
};

/**
 * 从域名列表组装当前环境的预览地址。
 *
 * @param env 当前环境（开发 / 线上）
 * @param domains 应用绑定的域名列表
 * @returns 可嵌入 iframe 的地址
 */
export const buildUserAppAppPreviewUrl = (
  env: UserAppDbEnvEnum,
  domains?: UserAppDomainInfo[],
): string => {
  return getUserAppAppProxyUrl(pickUserAppEnvDomain(env, domains));
};

/** 预览域名探测超时（毫秒） */
const PREVIEW_PROBE_TIMEOUT_MS = 5000;

/**
 * 判断预览域名是否可访问（no-cors，不读响应体与状态码）。
 * 与 Login 页域名预检同口径：网络可达即 resolve，DNS/连接失败/超时视为不可达。
 *
 * @param url 开发或线上预览根地址
 * @returns 网络可达为 true；无地址或不可达为 false
 */
export const probeUserAppPreviewUrlReachable = async (
  url: string,
): Promise<boolean> => {
  const trimmed = url?.trim();
  if (!trimmed) {
    return false;
  }

  try {
    await fetch(trimmed, {
      mode: 'no-cors',
      signal: AbortSignal.timeout(PREVIEW_PROBE_TIMEOUT_MS),
      cache: 'no-store',
    });
    return true;
  } catch {
    return false;
  }
};
