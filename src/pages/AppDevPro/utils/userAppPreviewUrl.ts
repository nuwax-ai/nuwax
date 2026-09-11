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
 * 应用预览代理路径（不含域名）。
 * 开发环境：/api/userapp/proxy/app/dev/{appId}/
 * 线上环境：/api/userapp/proxy/app/prod/{appId}/
 *
 * @param appId 应用 ID
 * @param env 当前环境（开发 / 线上）
 * @returns 代理路径；缺少 appId 时返回空字符串
 */
export const getUserAppAppProxyPath = (
  appId: number,
  env: UserAppDbEnvEnum,
): string => {
  if (!appId) {
    return '';
  }
  return `/api/userapp/proxy/app/${env}/${appId}/`;
};

/**
 * 应用预览地址：域名 + 环境代理路径。
 * 有域名时：{domain}/api/userapp/proxy/app/{env}/{appId}/
 * 无域名时回退：{BASE_URL}/api/userapp/proxy/app/{env}/{appId}/
 *
 * @param appId 应用 ID
 * @param env 当前环境（开发 / 线上）
 * @param domain 当前环境对应的开发或线上域名
 * @returns 可嵌入 iframe 的地址；缺少 appId 时返回空字符串
 */
export const getUserAppAppProxyUrl = (
  appId: number,
  env: UserAppDbEnvEnum,
  domain?: string,
): string => {
  const path = getUserAppAppProxyPath(appId, env);
  if (!path) {
    return '';
  }
  const origin = normalizeUserAppPreviewUrl(domain);
  if (origin) {
    return `${origin.replace(/\/$/, '')}${path}`;
  }
  const baseUrl = process.env.BASE_URL || '';
  return `${baseUrl}${path}`;
};

/**
 * 从域名列表组装当前环境的预览地址。
 *
 * @param appId 应用 ID
 * @param env 当前环境（开发 / 线上）
 * @param domains 应用绑定的域名列表
 * @returns 可嵌入 iframe 的地址
 */
export const buildUserAppAppPreviewUrl = (
  appId: number,
  env: UserAppDbEnvEnum,
  domains?: UserAppDomainInfo[],
): string => {
  return getUserAppAppProxyUrl(appId, env, pickUserAppEnvDomain(env, domains));
};
