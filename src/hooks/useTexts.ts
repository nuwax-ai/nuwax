import { getTexts } from '@/utils/locales';
import { useMemo } from 'react';
import useGlobalSettings from './useGlobalSettings';

/**
 * 多语言文本 Hook
 * 根据当前语言设置返回对应的文本内容
 *
 * @returns 当前语言的文本对象
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const texts = useTexts();
 *
 *   return (
 *     <div>
 *       <h1>{texts.title}</h1>
 *       <Button>{texts.confirm}</Button>
 *     </div>
 *   );
 * };
 * ```
 */
export const useTexts = () => {
  const { language } = useGlobalSettings();

  const texts = useMemo(() => {
    return getTexts(language);
  }, [language]);

  return texts;
};

export default useTexts;
