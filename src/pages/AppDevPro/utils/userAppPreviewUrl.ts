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
