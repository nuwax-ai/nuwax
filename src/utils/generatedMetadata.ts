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

/**
 * 拼接 generate-info 的 prompt（创建场景）
 * 优先使用描述，描述为空时才回退到名称
 */
export function buildGeneratePrompt(
  name?: string,
  description?: string,
): string {
  const desc = description?.trim();
  if (desc) {
    return desc;
  }
  return name?.trim() || '';
}

/** 创建弹窗生成图标超时（毫秒），超时后跳过生成 */
export const CREATE_ICON_GENERATE_TIMEOUT_MS = 15_000;

export interface FetchGeneratedMetadataOptions {
  /** 可选超时；不传则保持原有无超时逻辑（如会话详情页跳转后生成） */
  timeoutMs?: number;
}

/**
 * 调用 generate-info 获取元数据。
 * 接口成功且返回了名称时才给出结果；图标为空也返回，由调用方决定是否写入图标。
 *
 * @param prompt 生成提示词
 * @param options.timeoutMs 超时毫秒数，超时后返回 null
 * @returns 含名称的生成结果；失败、超时或没有名称时返回 null
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

  // 名称是写回项目的条件。图标可空，空图标不阻断后续更新接口。
  const name = res?.data?.name?.trim();
  if (res?.code === SUCCESS_CODE && name) {
    return res.data;
  }
  return null;
}
