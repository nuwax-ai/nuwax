import SvgIcon from '@/components/base/SvgIcon';
import { jumpBack } from '@/utils/router';
import { RocketOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import styles from './AppDevHeader.less';

const cx = classNames.bind(styles);

export interface AppDevHeaderProps {
  workspace: {
    name?: string;
    projectId?: string;
  };
  onReloadProject?: () => void;
  onDeleteProject?: () => void;
  onDeployProject?: () => void;
  hasUpdates?: boolean;
  lastSaveTime?: Date;
  isDeploying?: boolean;
}

/**
 * AppDev 页面顶部头部组件
 * 统一了 EditAgent 页面的头部样式和交互模式
 */
const AppDevHeader: React.FC<AppDevHeaderProps> = ({
  workspace,
  onDeployProject,
  hasUpdates = true,
  lastSaveTime = new Date(),
  isDeploying = false,
}) => {
  return (
    <header className={cx('flex', 'items-center', 'relative', styles.header)}>
      <SvgIcon
        name="icons-nav-backward"
        className={cx(styles['icon-backward'])}
        onClick={() => jumpBack('/')}
      />
      <Avatar size={27} icon={<UserOutlined />} className={cx(styles.avatar)} />
      <div className={cx('flex', 'flex-col', styles['header-info'])}>
        <div className={cx('flex', 'items-center')}>
          <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
            人工智能通识教育智能体
          </h3>
          <div className={cx('flex', 'items-center', styles['agent-rel-info'])}>
            <span className={cx(styles['space-name'], 'text-ellipsis')}>
              {workspace.name || '大模型三部曲'}
            </span>
            {workspace.projectId && (
              <span className={cx(styles['project-id'])}>
                项目ID: {workspace.projectId}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <div className={cx('flex', 'items-center', styles['save-time-box'])}>
          <span className={cx(styles['save-time'])}>
            草稿自动保存于&nbsp;
            {dayjs(lastSaveTime).format('HH:mm')}
          </span>
          {hasUpdates && (
            <Tag
              bordered={false}
              color="volcano"
              className={cx(styles['volcano'])}
            >
              有更新未部署
            </Tag>
          )}
        </div>
        <div className={cx('flex', 'items-center', styles['action-buttons'])}>
          {/* <Button
            size="small"
            className={styles.navButton}
            onClick={onReloadProject}
          >
            重新加载项目
          </Button> */}
          {/* <Button
            size="small"
            danger
            className={styles.actionButton}
            onClick={onDeleteProject}
          >
            删除
          </Button> */}
          <Tooltip
            title={
              isDeploying
                ? '正在部署项目...'
                : '部署项目到生产环境 (Ctrl/Cmd + D)'
            }
          >
            <Button
              type="primary"
              size="small"
              className={styles.deployButton}
              onClick={onDeployProject}
              loading={isDeploying}
              disabled={isDeploying}
              icon={isDeploying ? undefined : <RocketOutlined />}
            >
              {isDeploying ? '部署中...' : '部署'}
            </Button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
};

export default AppDevHeader;
