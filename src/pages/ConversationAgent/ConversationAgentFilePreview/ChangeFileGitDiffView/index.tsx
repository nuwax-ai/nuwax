import { getLanguageFromFile } from '@/utils/monacoConfig';
import { generateDiffFile } from '@git-diff-view/file';
import { DiffModeEnum, DiffView } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** diff 主题 */
export type GitDiffViewTheme = 'light' | 'dark';

export { DiffModeEnum };

export interface ChangeFileGitDiffViewProps {
  /** 文件 ID（用于 diff 实例刷新） */
  fileId: string;
  /** 文件名（用于语法高亮） */
  fileName: string;
  /** 原始文件内容 */
  originalContent: string;
  /** 修改后的文件内容 */
  modifiedContent: string;
  /**
   * diff 主题；不传时跟随页面 `data-theme` 自动切换
   * @default 跟随 document.documentElement[data-theme]
   */
  diffViewTheme?: GitDiffViewTheme;
  /**
   * diff 展示模式：并排 / 统一
   * @default DiffModeEnum.Split
   */
  diffViewMode?: DiffModeEnum;
  className?: string;
}

const DEFAULT_DIFF_VIEW_MODE = DiffModeEnum.Split;

/**
 * 基于 @git-diff-view/react 的 Git 风格 diff 展示
 * 用于源代码管理中的文件变更对比（只读）
 */
const ChangeFileGitDiffView: React.FC<ChangeFileGitDiffViewProps> = ({
  fileId,
  fileName,
  originalContent,
  modifiedContent,
  diffViewTheme: diffViewThemeProp,
  diffViewMode = DEFAULT_DIFF_VIEW_MODE,
  className,
}) => {
  const isThemeControlled = diffViewThemeProp !== undefined;
  const [autoTheme, setAutoTheme] = useState<GitDiffViewTheme>('light');

  /** 未传入 diffViewTheme 时，跟随页面 data-theme */
  useEffect(() => {
    if (isThemeControlled) {
      return;
    }
    const root = document.documentElement;
    const syncTheme = () => {
      setAutoTheme(
        root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
      );
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [isThemeControlled]);

  const resolvedTheme = diffViewThemeProp ?? autoTheme;

  const diffFile = useMemo(() => {
    const language = getLanguageFromFile(fileName);
    const file = generateDiffFile(
      fileName,
      originalContent ?? '',
      fileName,
      modifiedContent ?? '',
      language,
      language,
    );
    file.initTheme(resolvedTheme);
    file.init();
    if (diffViewMode === DiffModeEnum.Unified) {
      file.buildUnifiedDiffLines();
    } else {
      file.buildSplitDiffLines();
    }
    return file;
  }, [
    fileId,
    fileName,
    originalContent,
    modifiedContent,
    resolvedTheme,
    diffViewMode,
  ]);

  return (
    <div className={cx('diff-view-root', className)}>
      <DiffView
        key={`${fileId}-${resolvedTheme}-${diffViewMode}`}
        diffFile={diffFile}
        diffViewMode={diffViewMode}
        diffViewTheme={resolvedTheme}
        diffViewHighlight
        diffViewWrap
      />
    </div>
  );
};

export default ChangeFileGitDiffView;
