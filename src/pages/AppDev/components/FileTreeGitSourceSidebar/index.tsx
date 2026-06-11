import type { FileTreeGitSourcePanelProps } from '@/components/business-component/FileTreeGitSourcePanel';
import FileTreeGitSourcePanel from '@/components/business-component/FileTreeGitSourcePanel';
import { dict } from '@/services/i18nRuntime';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * AppDev 网页应用文件树侧栏
 * 在 FileTreeGitSourcePanel 外包一层可折叠侧栏与悬浮折叠按钮
 */
const FileTreeGitSourceSidebar: React.FC<FileTreeGitSourcePanelProps> = (
  props,
) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cx(styles.sidebarWrapper, {
        [styles.collapsed]: isCollapsed,
      })}
    >
      {/* 悬浮折叠/展开按钮：展开时在文件树面板右下角，收起时在左侧 */}
      <Tooltip
        title={
          isCollapsed
            ? dict('PC.Pages.AppDevFileTreePanel.expand')
            : dict('PC.Pages.AppDevFileTreePanel.collapse')
        }
      >
        <Button
          shape="circle"
          size="small"
          icon={isCollapsed ? <RightOutlined /> : <LeftOutlined />}
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={cx(styles.collapseButton, {
            [styles.collapsed]: isCollapsed,
            [styles.expanded]: !isCollapsed,
          })}
        />
      </Tooltip>

      <FileTreeGitSourcePanel {...props} isCollapsed={isCollapsed} />
    </div>
  );
};

export default FileTreeGitSourceSidebar;
