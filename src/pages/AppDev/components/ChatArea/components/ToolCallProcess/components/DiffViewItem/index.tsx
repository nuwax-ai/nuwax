import { generateDiffFile } from '@git-diff-view/file';
import { DiffModeEnum, DiffView } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 极简、快速且鲁棒的行级差异统计函数（Myers / LCS 基础版）
 */
const getDiffStats = (oldStr: string = '', newStr: string = '') => {
  const oldLines = (oldStr || '').split('\n');
  const newLines = (newStr || '').split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  // 使用动态规划计算最长公共子序列（LCS）
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const lcs = dp[m][n];
  const deletions = m - lcs;
  const additions = n - lcs;

  return { additions, deletions };
};

const getLanguage = (path: string) => {
  if (!path) return 'typescript';
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'less':
      return 'less';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    default:
      return 'typescript';
  }
};

interface DiffViewItemProps {
  item: {
    path: string;
    oldText?: string;
    newText?: string;
  };
  index: number;
}

/**
 * 单个 Diff 文件差异渲染独立组件
 */
const DiffViewItem: React.FC<DiffViewItemProps> = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const cleanPath = (path: string = '') => {
    return path.replace(/^\/app\/project_workspace\/[^/]+\//, '');
  };

  const { additions, deletions } = getDiffStats(item.oldText, item.newText);

  // 缓存 diff 文件的生成以优化渲染性能
  const diffFile = useMemo(() => {
    const lang = getLanguage(item.path);
    const file = generateDiffFile(
      'oldFile',
      item.oldText || '',
      'newFile',
      item.newText || '',
      lang,
      lang,
    );
    file.initTheme('light');
    file.init();
    file.buildUnifiedDiffLines();
    return file;
  }, [item.path, item.oldText, item.newText]);

  return (
    <div className={cx(styles['diff-item-container'])} key={index}>
      <div
        className={cx(styles['diff-item-header'])}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cx(styles['diff-item-path-container'])}>
          <span className={cx(styles['diff-item-file-icon'])}>📄</span>
          <span className={cx(styles['diff-item-path'])} title={item.path}>
            {cleanPath(item.path)}
          </span>
        </div>
        <div className={cx(styles['diff-item-stats'])}>
          {additions > 0 && (
            <span className={cx(styles['diff-item-added'])}>+{additions}</span>
          )}
          {deletions > 0 && (
            <span className={cx(styles['diff-item-deleted'])}>
              -{deletions}
            </span>
          )}
          <span className={cx(styles['diff-item-toggle-icon'])}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className={cx(styles['diff-viewer-wrapper'])}>
          <DiffView
            diffFile={diffFile}
            diffViewMode={DiffModeEnum.Unified}
            diffViewTheme="light"
            diffViewHighlight={true}
          />
        </div>
      )}
    </div>
  );
};

export default DiffViewItem;
