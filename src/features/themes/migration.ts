import { backgroundConfigs, STORAGE_KEYS } from '@/constants/theme.constants';
import {
  encodeThemeText,
  limits,
  officialThemePackage,
  validateThemePackage,
} from './core';
import { themeRuntime } from './runtime';

const decode = (value: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(value), (c) => c.charCodeAt(0)),
  );
const encodeBytes = (bytes: Uint8Array) => {
  const chunks: string[] = [];
  for (let start = 0; start < bytes.length; start += 32768)
    chunks.push(String.fromCharCode(...bytes.subarray(start, start + 32768)));
  return btoa(chunks.join(''));
};

async function readLegacyBackground(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok || !response.body)
      throw new Error('Legacy background unavailable');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > limits.fileBytes) {
        await reader.cancel();
        throw new Error('Legacy background too large');
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return encodeBytes(bytes);
  } finally {
    window.clearTimeout(timeout);
  }
}

/** 迁移提交仍由仓库检查“未选择”条件，避免异步图片读取覆盖用户的新选择。 */
export async function migrateLegacyTheme(): Promise<void> {
  const initial = themeRuntime.getState();
  if (
    initial.hasUserSelection ||
    initial.error ||
    initial.recovery ||
    initial.selection.themeId !== 'nuwax-default' ||
    initial.themes.some((item) => item.id === 'nuwax-migrated')
  )
    return;
  if (!localStorage.getItem(STORAGE_KEYS.HAS_USER_SWITCH_THEME)) return;
  const raw = localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG);
  if (!raw) return;
  const config = JSON.parse(raw);
  const color =
    typeof config.selectedThemeColor === 'string' &&
    /^#[0-9a-f]{6}$/i.test(config.selectedThemeColor)
      ? config.selectedThemeColor
      : undefined;
  const background = backgroundConfigs.find(
    (item) => item.id === config.selectedBackgroundId,
  );
  if (!color && !background?.url) return;
  const files = { ...officialThemePackage.files };
  const manifest = JSON.parse(decode(files['theme.json']));
  manifest.id = 'nuwax-migrated';
  manifest.name = 'My Previous Theme';
  for (const mode of ['light', 'dark'] as const) {
    const path = manifest.variants[mode].tokens;
    const tokens = JSON.parse(decode(files[path]));
    if (color) tokens.primary = color;
    files[path] = encodeThemeText(JSON.stringify(tokens));
  }
  if (background?.url) {
    files['assets/legacy.png'] = await readLegacyBackground(background.url);
    files['styles/legacy.css'] = encodeThemeText(
      ':root { --nuwax-background-image: url("../assets/legacy.png"); }',
    );
    for (const mode of ['light', 'dark'])
      manifest.variants[mode].styles = { common: ['styles/legacy.css'] };
  }
  files['theme.json'] = encodeThemeText(JSON.stringify(manifest));
  validateThemePackage(files);
  if (themeRuntime.getState().hasUserSelection) return;
  const installed = await themeRuntime.install(files);
  if (!installed.ok)
    throw new Error(installed.error || 'Legacy theme migration failed');
  const mode = config.antdTheme === 'dark' ? 'dark' : 'light';
  const result = await themeRuntime.select(manifest.id, mode, true);
  if (!result.ok && !result.conflict)
    throw new Error(result.error || 'Legacy theme selection failed');
}
