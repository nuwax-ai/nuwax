import { validateThemePackage } from './package.mjs';
import { defaultTokens } from './tokens.mjs';
export function encodeThemeText(text) {
  const bytes = new TextEncoder().encode(text);
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw);
}
function make(id, name, light, dark) {
  return validateThemePackage({
    'theme.json': encodeThemeText(
      JSON.stringify({
        schemaVersion: 1,
        id,
        name,
        version: '1.0.0',
        variants: {
          light: { tokens: 'light.json' },
          dark: { tokens: 'dark.json' },
        },
      }),
    ),
    'light.json': encodeThemeText(JSON.stringify(light)),
    'dark.json': encodeThemeText(JSON.stringify(dark)),
    'README.md': encodeThemeText(
      'Theme package schemaVersion 1. See docs/theme-packages.md.',
    ),
  });
}
export const officialThemePackage = make(
  'nuwax-default',
  'Nuwax Default',
  defaultTokens.light,
  defaultTokens.dark,
);
export const deepSeekThemePackage = make(
  'deepseek-inspired',
  'DeepSeek Inspired',
  {
    primary: '#4d6bfe',
    'primary.hover': '#3b55db',
    'primary.active': '#2d42ba',
    'sidebar.bg': '#f9fbff',
    'selected.bg': '#edf2ff',
    'chat.user.bg': '#edf2ff',
    'radius.large': '16px',
  },
  {
    primary: '#8096ff',
    'primary.hover': '#a3b2ff',
    'primary.active': '#667fff',
    'sidebar.bg': '#1c1e25',
    'selected.bg': '#293357',
    'chat.user.bg': '#293357',
    'radius.large': '16px',
  },
);
