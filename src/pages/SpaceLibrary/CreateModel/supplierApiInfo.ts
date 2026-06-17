import {
  ModelApiProtocolEnum,
  ModelCapabilityTypeEnum,
} from '@/types/enums/modelConfig';
import type { ModelProviderInfo } from '@/types/interfaces/model';

/** modalities.input：每项仅限 text / image / audio / video（可多选任意子集，长度 1～4）；大小写与空格不敏感 */
const MODALITY_INPUT_LABEL_TO_ENUM: Record<string, ModelCapabilityTypeEnum> = {
  text: ModelCapabilityTypeEnum.Text,
  image: ModelCapabilityTypeEnum.Image,
  audio: ModelCapabilityTypeEnum.Audio,
  video: ModelCapabilityTypeEnum.Video,
};

// 规范化 modalities.input 中的标签，统一为小写并去除空格
function normalizeModalityInputLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * 将 modalities.input 转为表单 types；无法识别的条目跳过；按数组顺序首次出现去重。
 */
export function mapModalitiesInputsToCapabilityTypes(
  inputs: readonly string[] | undefined,
): ModelCapabilityTypeEnum[] {
  if (!inputs?.length) return [];
  const out: ModelCapabilityTypeEnum[] = [];
  const seen = new Set<ModelCapabilityTypeEnum>();
  for (const raw of inputs) {
    const key = normalizeModalityInputLabel(raw);
    const mapped = key ? MODALITY_INPUT_LABEL_TO_ENUM[key] : undefined;
    if (mapped !== undefined && !seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return out;
}

/** 供应商 apiInfo Record 的 key 映射为表单使用的 ModelApiProtocolEnum */
export function recordKeyToModelApiProtocol(
  recordKey: string,
): ModelApiProtocolEnum | null {
  const t = recordKey.trim();
  for (const e of Object.values(ModelApiProtocolEnum)) {
    if (e.toLowerCase() === t.toLowerCase()) return e;
  }
  return null;
}

/** 列出供应商 apiInfo 中能识别出的协议枚举 */
export function supplierResolvableProtocols(
  apiInfo?: Record<string, string>,
): Set<ModelApiProtocolEnum> | null {
  if (!apiInfo) return null;
  const set = new Set<ModelApiProtocolEnum>();
  for (const key of Object.keys(apiInfo)) {
    const mapped = recordKeyToModelApiProtocol(key);
    if (mapped) set.add(mapped);
  }
  return set.size ? set : null;
}

/**
 * 从供应商 apiInfo（协议 key → 基址 URL）中，取出与当前表单协议枚举匹配的地址；遍历顺序与对象键序一致
 */
export function supplierUrlForProtocol(
  apiInfo: Record<string, string> | undefined,
  protocol: ModelApiProtocolEnum,
): string | null {
  if (!apiInfo) return null;
  for (const [k, url] of Object.entries(apiInfo)) {
    if (!url?.trim()) continue;
    if (recordKeyToModelApiProtocol(k) === protocol) return url.trim();
  }
  return null;
}

/**
 * 选中供应商时的默认协议与首条可用 URL：取 apiInfo 中第一条非空 URL；
 * 协议由 Record 的 key 经 recordKeyToModelApiProtocol 解析，无法识别时回落 OpenAI
 */
export function supplierDefaultProtocolAndUrl(provider: ModelProviderInfo): {
  protocol: ModelApiProtocolEnum;
  url: string;
} | null {
  const entries = Object.entries(provider.apiInfo ?? {}).filter(
    ([, url]) => typeof url === 'string' && url.trim() !== '',
  );
  if (!entries.length) return null;
  const [firstKey, firstUrl] = entries[0]!;
  return {
    protocol:
      recordKeyToModelApiProtocol(firstKey) ?? ModelApiProtocolEnum.OpenAI,
    url: firstUrl.trim(),
  };
}
