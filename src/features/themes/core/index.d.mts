export type ThemeSurface = 'web' | 'shell' | 'message' | 'repo';
export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeMode = 'light' | 'dark';
export type ThemeTokenName =
  | 'app.bg'
  | 'surface.bg'
  | 'sidebar.bg'
  | 'elevated.bg'
  | 'input.bg'
  | 'text.primary'
  | 'text.secondary'
  | 'text.disabled'
  | 'text.inverse'
  | 'border.default'
  | 'border.strong'
  | 'primary'
  | 'primary.hover'
  | 'primary.active'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'hover.bg'
  | 'selected.bg'
  | 'focus.ring'
  | 'chat.user.bg'
  | 'chat.user.text'
  | 'chat.assistant.bg'
  | 'chat.assistant.text'
  | 'chat.think.bg'
  | 'chat.think.text'
  | 'code.bg'
  | 'code.text'
  | 'editor.bg'
  | 'editor.text'
  | 'terminal.bg'
  | 'terminal.text'
  | 'font.family'
  | 'font.code'
  | 'font.size'
  | 'radius.small'
  | 'radius.medium'
  | 'radius.large'
  | 'spacing.small'
  | 'spacing.medium'
  | 'spacing.large';
export type ThemeTokens = Record<ThemeTokenName, string>;
export type ThemeFiles = Record<string, string>;
export interface ThemeVariant {
  tokens: string;
  styles?: Partial<Record<'common' | ThemeSurface, string[]>>;
}
export interface ThemeManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  preview?: string;
  variants: Partial<Record<ThemeMode, ThemeVariant>>;
}
export interface ThemePackage {
  manifest: ThemeManifest;
  files: ThemeFiles;
}
export interface ThemeSnapshot {
  revision: number;
  themeId: string;
  name: string;
  mode: ThemeMode;
  tokens: ThemeTokens;
  css: Record<ThemeSurface, string>;
  assets: Record<string, { mime: string; base64: string }>;
}
export function validateThemePackage(files: ThemeFiles): ThemePackage;
export function resolveThemePackage(
  pkg: ThemePackage,
  preference: ThemePreference,
  systemDark: boolean,
  revision: number,
): ThemeSnapshot;
export function canonicalPath(path: string): string;
export const limits: Readonly<{
  files: number;
  fileBytes: number;
  totalBytes: number;
}>;
export const officialThemeIds: readonly string[];
/** Installers MUST call this before inserting/replacing any external package. */
export function assertInstallableThemeId(id: string): void;
export const defaultTokens: Record<ThemeMode, ThemeTokens>;
export const tokenNames: ThemeTokenName[];
export const surfaces: ThemeSurface[];
export function tokenToCssVariables(
  tokens: Partial<ThemeTokens>,
): Record<string, string>;
export interface ThemeAntdTokens {
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryActive: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  colorBgBase: string;
  colorBgContainer: string;
  colorBgElevated: string;
  colorText: string;
  colorTextSecondary: string;
  colorTextDisabled: string;
  colorTextLightSolid: string;
  colorBorder: string;
  fontFamily: string;
  fontFamilyCode: string;
  fontSize: number;
  borderRadius: number;
  borderRadiusSM: number;
  borderRadiusLG: number;
  paddingXS: number;
  padding: number;
  paddingLG: number;
}
export function tokenToAntd(tokens: ThemeTokens): ThemeAntdTokens;
export const officialThemePackage: ThemePackage;
export const deepSeekThemePackage: ThemePackage;
export function encodeThemeText(text: string): string;
