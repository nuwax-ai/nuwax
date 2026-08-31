import { dict } from '@/services/i18nRuntime';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 「项目」Tab 面板。
 *
 * 项目数据接口后端尚未提供(未 ready),当前先落地 Tab 骨架与空态;
 * 接口就绪后在此接入项目列表(项目行 + 「+」新建 + 展开收起子项)。
 */
const ProjectPanel: React.FC = () => {
  return (
    <div className={cx(styles['project-panel'])}>
      <Typography.Text type="secondary" className={cx(styles['project-empty'])}>
        {dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.noProjects')}
      </Typography.Text>
    </div>
  );
};

export default ProjectPanel;
