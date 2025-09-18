import { useEffect } from 'react';

/**
 * 禁用浏览器原生 Ctrl+S / Cmd+S 快捷键
 * @param onSave 可选，拦截后自定义保存逻辑
 */
const useDisableSaveShortcut = (onSave?: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 's') {
        e.preventDefault();
        if (onSave) onSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave]);
};

export default useDisableSaveShortcut;
