import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/** 更新三方应用基本信息参数 */
export interface ThirdAppOauth2UpdateParams {
  /** 统一项目 ID（user_project 主键） */
  projectId: number;
  /** 应用名称，≤128 字符；null=不更新，空值会被拒绝 */
  name?: string;
  /** 应用描述，≤512 字符；null=不更新，空串=清空 */
  description?: string;
  /** 应用图标地址；null=不更新，空串=清空 */
  icon?: string;
}

/** 三方应用 OAuth2 配置（更新接口响应） */
export interface ThirdAppOauth2Info {
  /** 统一项目 ID（user_project 主键，创建接口据此回传新应用 id） */
  projectId: number;
  /** OAuth2 Client ID */
  clientId: string;
  /** 是否已生成 Client Secret（明文需调 /secret/{projectId} 单独获取） */
  hasClientSecret: boolean;
  /** 应用主页地址 */
  homepageUrl: string;
  /** OAuth2 回调地址 */
  redirectUri: string;
  /** 本应用允许申请的 scope */
  scopes: string[];
  /** OAuth2 接入是否启用 */
  enabled: boolean;
}

/** OAuth2 应用完整信息（仅读接口响应） */
export interface ThirdAppOauth2AppInfo extends ThirdAppOauth2Info {
  /** 项目类型：三方应用或全栈应用 */
  projectType: AgentComponentTypeEnum.ThirdApp | AgentComponentTypeEnum.UserApp;
  /** 应用名称 */
  name: string;
  /** 应用描述 */
  description: string;
  /** 应用图标 */
  icon: string;
  /** 所属空间 ID */
  spaceId: number;
  /** 创建者用户 ID */
  creatorId: number;
  /** 创建时间 */
  created: string;
  /** 修改时间 */
  modified: string;
  /** 发布状态（与列表页 publishStatus 语义一致） */
  publishStatus?: PublishStatusEnum;
}

/** 保存主页地址与回调地址（留空表示不修改） */
export interface ThirdAppOauth2SettingSaveParams {
  /*统一项目 ID（user_project 主键） */
  projectId: number;

  /*项目类型：可用值:Agent,Plugin,Skill,PageApp,UserApp,NormalProject,Connector,ThirdApp,Workflow,Knowledge,Table,Model,Mcp */
  projectType: AgentComponentTypeEnum;

  /*应用主页地址；留空表示不修改 */
  homepageUrl?: string;

  /*OAuth2 回调地址；留空表示不修改 */
  redirectUri?: string;
}

/**
 * 更新三方应用基本信息（名称 / 描述 / 图标）。
 *
 * @param data 更新参数
 * @returns OAuth2 配置
 */
export async function apiThirdAppOauth2Update(
  data: ThirdAppOauth2UpdateParams,
): Promise<RequestResponse<ThirdAppOauth2Info>> {
  return request('/api/user-project/oauth2/update', {
    method: 'POST',
    data,
  });
}

/** 保存主页地址与回调地址（留空表示不修改） */
export async function apiThirdAppOauth2SettingSave(
  data: ThirdAppOauth2SettingSaveParams,
): Promise<RequestResponse<ThirdAppOauth2Info>> {
  return request('/api/user-project/oauth2/setting/save', {
    method: 'POST',
    data,
  });
}

/** 重新生成 OAuth2 凭证响应（Client Secret 明文仅此返回，请立即保存） */
export interface ThirdAppOauth2CredentialInfo {
  /** OAuth2 Client ID */
  clientId: string;
  /** OAuth2 Client Secret 明文；请立即保存，平台不再重复展示（可另调 /secret 查看） */
  clientSecret: string;
}

/**
 * 重新生成 OAuth2 Client ID / Client Secret。
 *
 * @param projectId 统一项目 ID
 * @returns 新凭证（含 Secret 明文）
 */
export async function apiThirdAppOauth2CredentialRegenerate(
  projectId: string,
): Promise<RequestResponse<ThirdAppOauth2CredentialInfo>> {
  return request(
    `/api/user-project/oauth2/credential/regenerate/${projectId}`,
    {
      method: 'POST',
    },
  );
}

// 参数接口
export interface ThirdAppOauth2CreateParams {
  /*空间ID；不传则取当前用户的个人空间 */
  spaceId?: number;

  /*应用名称；留空按当前语言取默认名 */
  name?: string;

  /*应用描述 */
  description?: string;

  /*应用图标 */
  icon?: string;
}

// 创建三方应用（自动生成 OAuth2 凭证；明文密钥仍需调 -secret 获取）
export async function apiThirdAppOauth2CredentialCreate(
  data: ThirdAppOauth2CreateParams,
): Promise<RequestResponse<ThirdAppOauth2Info>> {
  return request('/api/user-project/oauth2/create', {
    method: 'POST',
    data,
  });
}

// 查询 OAuth2 认证信息（首次访问自动生成凭证，不含密钥明文）
export async function apiThirdAppOauth2SettingGet(
  projectId: number,
  projectType?: AgentComponentTypeEnum,
): Promise<RequestResponse<ThirdAppOauth2Info>> {
  return request(`/api/user-project/oauth2/setting/${projectId}`, {
    method: 'GET',
    params: {
      projectType,
    },
  });
}

// 查看 Client Secret 明文（审计留痕）
export async function apiThirdAppOauth2SecretGet(
  projectId: number,
  projectType?: AgentComponentTypeEnum,
): Promise<RequestResponse<string>> {
  return request(`/api/user-project/oauth2/secret/${projectId}`, {
    method: 'GET',
    params: {
      projectType,
    },
  });
}

// 查询三方应用信息（仅读，不自动生成凭证）
export async function apiThirdAppOauth2InfoGet(
  projectId: number,
  projectType?: AgentComponentTypeEnum,
): Promise<RequestResponse<ThirdAppOauth2AppInfo>> {
  return request(`/api/user-project/oauth2/info/${projectId}`, {
    method: 'GET',
    params: {
      projectType,
    },
  });
}

// 删除三方应用（凭证随行吊销：已签发授权码与令牌立即失效）
export async function apiThirdAppOauth2Delete(
  projectId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/oauth2/delete/${projectId}`, {
    method: 'POST',
  });
}
