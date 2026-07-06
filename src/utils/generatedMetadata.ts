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

/** 创建弹窗生成图标超时（毫秒），超时后跳过生成 */
export const CREATE_ICON_GENERATE_TIMEOUT_MS = 15_000;

export interface FetchGeneratedMetadataOptions {
  /** 可选超时；不传则保持原有无超时逻辑（如会话详情页跳转后生成） */
  timeoutMs?: number;
}

/**
 * 调用 generate-info 获取元数据
 * @param prompt 生成提示词
 * @param options.timeoutMs 超时毫秒数，超时后返回 null
 */
export async function fetchGeneratedMetadata(
  prompt: string,
  options?: FetchGeneratedMetadataOptions,
): Promise<GeneratedMetadata | null> {
  const text = prompt.trim();
  if (!text) {
    return null;
  }

  const requestPromise = apiAgentGenerateInfo({ prompt: text });
  let res: Awaited<ReturnType<typeof apiAgentGenerateInfo>>;

  if (options?.timeoutMs && options.timeoutMs > 0) {
    // 超时后忽略未完成请求，避免 unhandled rejection
    requestPromise.catch(() => {});
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('GENERATE_ICON_TIMEOUT')),
        options.timeoutMs,
      );
    });
    try {
      res = await Promise.race([requestPromise, timeoutPromise]);
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId!);
    }
  } else {
    res = await requestPromise;
  }

  if (res?.code === SUCCESS_CODE && res?.data?.iconUrl) {
    return res.data;
  }
  return null;
}
