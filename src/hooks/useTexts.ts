import { getTexts } from '@/utils/locales';
import { useMemo } from 'react';
import { useUnifiedTheme } from './useUnifiedTheme';

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
  const { data } = useUnifiedTheme();

  const texts = useMemo(() => {
    return getTexts(data.language);
  }, [data.language]);

  return texts;
};

export default useTexts;
