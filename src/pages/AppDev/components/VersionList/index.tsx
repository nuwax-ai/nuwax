/**
 * 版本列表组件
 * 显示项目的版本历史信息
 */

import type { VersionInfoItem } from '@/types/interfaces/appDev';
import { ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { Empty, List, Tag, Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const { Text } = Typography;
const cx = classNames.bind(styles);

export interface VersionListProps {
  /** 版本列表数据 */
  versionList: VersionInfoItem[];
  /** 当前选中的版本 */
  currentVersion?: number;
  /** 获取操作类型文本 */
  getActionText: (action: string) => string;
  /** 获取操作类型颜色 */
  getActionColor: (action: string) => string;
  /** 格式化版本时间 */
  formatVersionTime: (time: string) => string;
  /** 版本选择回调 */
  onVersionSelect?: (version: number) => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 版本列表组件
 * 展示项目的版本历史，支持版本选择和操作类型显示
 */
const VersionList: React.FC<VersionListProps> = ({
  versionList,
  currentVersion,
  getActionText,
  getActionColor,
  formatVersionTime,
  onVersionSelect,
  showActions = true,
  className,
}) => {
  /**
   * 处理版本选择
   */
  const handleVersionSelect = (version: number) => {
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  /**
   * 渲染版本项
   */
  const renderVersionItem = (item: VersionInfoItem) => {
    const isCurrentVersion = currentVersion === item.version;
    const isLatestVersion =
      versionList.length > 0 && item.version === versionList[0].version;

    return (
      <List.Item
        key={item.version}
        className={cx('version-item', {
          'current-version': isCurrentVersion,
          'latest-version': isLatestVersion,
        })}
        onClick={() => handleVersionSelect(item.version)}
      >
        <div className={cx('version-content')}>
          {/* 版本号和时间 */}
          <div className={cx('version-header')}>
            <div className={cx('version-info')}>
              <Text
                strong={isCurrentVersion}
                className={cx('version-number', {
                  current: isCurrentVersion,
                  latest: isLatestVersion,
                })}
              >
                v{item.version}
              </Text>
              <Text type="secondary" className={cx('version-time')}>
                <ClockCircleOutlined className={cx('time-icon')} />
                {formatVersionTime(item.time)}
              </Text>
            </div>

            {/* 操作类型标签 */}
            <Tag
              color={getActionColor(item.action)}
              className={cx('action-tag')}
            >
              {getActionText(item.action)}
            </Tag>
          </div>

          {/* 版本状态指示器 */}
          <div className={cx('version-indicators')}>
            {isCurrentVersion && (
              <Tag color="processing" className={cx('status-tag')}>
                当前版本
              </Tag>
            )}
            {isLatestVersion && !isCurrentVersion && (
              <Tag color="success" className={cx('status-tag')}>
                最新版本
              </Tag>
            )}
          </div>
        </div>
      </List.Item>
    );
  };

  return (
    <div
      className={cx('version-list-container', className, {
        'chat-version-list': className?.includes('versionListInChat'),
      })}
    >
      {/* 版本列表标题 */}
      <div className={cx('version-list-header')}>
        <HistoryOutlined className={cx('header-icon')} />
        <Text strong className={cx('header-title')}>
          版本历史
        </Text>
        <Text type="secondary" className={cx('version-count')}>
          ({versionList.length} 个版本)
        </Text>
      </div>

      {/* 版本列表 */}
      <div className={cx('version-list-content')}>
        {versionList.length > 0 ? (
          <List
            dataSource={versionList}
            renderItem={renderVersionItem}
            className={cx('version-list')}
            size="small"
          />
        ) : (
          <Empty
            description="暂无版本历史"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className={cx('empty-state')}
          />
        )}
      </div>

      {/* 操作提示 */}
      {showActions && versionList.length > 0 && (
        <div className={cx('version-actions')}>
          <Text type="secondary" className={cx('action-hint')}>
            💡 点击版本号可切换到对应版本
          </Text>
        </div>
      )}
    </div>
  );
};

export default VersionList;
