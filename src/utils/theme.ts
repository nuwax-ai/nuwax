import {
  defaultSettings,
  SETTINGS_STORAGE_KEY,
} from '@/hooks/useGlobalSettings';

export const getCurrentTheme = () => {
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  const base = defaultSettings;
  const stored = saved ? { ...base, ...JSON.parse(saved) } : base;
  return stored;
};

export const getCurrentThemeMode = () => {
  return getCurrentTheme().theme;
};

export const isCurrentDarkMode = () => {
  return getCurrentThemeMode() === 'dark';
};
