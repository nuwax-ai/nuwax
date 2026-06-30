import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentGenerateInfo } from '@/services/appDev';

/** generate-info 接口返回结构 */
export interface GeneratedMetadata {
  name: string;
  description: string;
  iconUrl: string;
}

/**
 * 从 generate-info 结果解析应写入字段：仅 icon；描述仅在当前为空时回填
 */
export function pickIconAndDescription(
  meta: GeneratedMetadata,
  currentDescription?: string,
): { icon?: string; description?: string } {
  const result: { icon?: string; description?: string } = {};
  if (meta.iconUrl?.trim()) {
    result.icon = meta.iconUrl.trim();
  }
  if (!currentDescription?.trim() && meta.description?.trim()) {
    result.description = meta.description.trim();
  }
  return result;
}

/** 用名称、描述拼接 generate-info 的 prompt */
export function buildGeneratePrompt(
  name?: string,
  description?: string,
): string {
  return [name?.trim(), description?.trim()].filter(Boolean).join('\n');
}

/** 调用 generate-info 获取元数据 */
export async function fetchGeneratedMetadata(
  prompt: string,
): Promise<GeneratedMetadata | null> {
  const text = prompt.trim();
  if (!text) {
    return null;
  }
  const res = await apiAgentGenerateInfo({ prompt: text });
  if (res?.code === SUCCESS_CODE && res?.data?.iconUrl) {
    return res.data;
  }
  return null;
}
