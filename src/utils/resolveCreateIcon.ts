import {
  buildGeneratePrompt,
  CREATE_ICON_GENERATE_TIMEOUT_MS,
  fetchGeneratedMetadata,
  pickIconAndDescription,
} from '@/utils/generatedMetadata';

export interface ResolveCreateIconParams {
  imageUrl?: string;
  name?: string;
  description?: string;
}

/** 创建弹窗提交前：未上传图标时调用 generate-info */
export async function resolveCreateIcon(
  params: ResolveCreateIconParams,
): Promise<{ icon: string; description?: string }> {
  const { imageUrl = '', name, description } = params;
  if (imageUrl?.trim()) {
    return { icon: imageUrl, description };
  }

  const prompt = buildGeneratePrompt(name, description);
  if (!prompt) {
    return { icon: imageUrl, description };
  }

  try {
    const meta = await fetchGeneratedMetadata(prompt, {
      timeoutMs: CREATE_ICON_GENERATE_TIMEOUT_MS,
    });
    if (!meta) {
      return { icon: imageUrl, description };
    }
    const patch = pickIconAndDescription(meta, description);
    return {
      icon: patch.icon ?? imageUrl,
      description: patch.description ?? description,
    };
  } catch {
    return { icon: imageUrl, description };
  }
}
