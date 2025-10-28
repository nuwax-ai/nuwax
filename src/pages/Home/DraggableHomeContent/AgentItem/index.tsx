import agentImage from '@/assets/images/agent_image.png';
import { AgentItemProps } from '@/types/interfaces/agentConfig';
import { StarFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 首页智能体列表项
const AgentItem: React.FC<AgentItemProps> = ({
  info,
  onItemClick,
  onToggleCollect,
}) => {
  // 状态管理
  const [isCollecting, setIsCollecting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 收藏、取消收藏事件
  const handlerCollect = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();

    if (isCollecting) return; // 防止重复点击

    try {
      setIsCollecting(true);
      await onToggleCollect();
    } catch (error) {
      console.error('收藏操作失败:', error);
      // 这里可以添加错误提示
    } finally {
      setIsCollecting(false);
    }
  };

  // 图片加载错误处理
  const handleImageError = () => {
    setImageError(true);
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (info?.publishUser?.nickName) {
      return info.publishUser.nickName;
    }
    if (info?.publishUser?.userName) {
      return info.publishUser.userName;
    }
    return '未知用户';
  };

  // 获取智能体描述
  const getDescription = () => {
    if (!info?.description) {
      return '暂无描述';
    }
    return info.description;
  };

  return (
    <div
      className={cx(styles.container)}
      onClick={onItemClick}
      title={`${info?.name || '智能体'} - ${getDescription()}`}
    >
      {/* 智能体头像 */}
      <div className={styles['img-wrapper']}>
        <img
          className={cx(styles.img)}
          src={imageError ? agentImage : info.icon || agentImage}
          alt={info?.name || '智能体头像'}
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      {/* 信息区域 - 包含标题和用户信息 */}
      <div className={cx(styles['info-box'])}>
        {/* 标题区域 */}
        <Typography.Title
          level={5}
          ellipsis={{
            rows: 1,
            expandable: false,
            symbol: '...',
          }}
          title={info?.name || '智能体名称'}
          className={styles['title-section']}
        >
          {info?.name || '未命名智能体'}
        </Typography.Title>

        {/* 用户信息区域 */}
        <div className={styles['source-section']}>
          <p className={cx(styles.source)}>
            {/* <UserOutlined className={styles['user-icon']} /> */}
            来自 {getUserDisplayName()}
          </p>
        </div>
      </div>

      {/* 收藏按钮 */}
      <span
        className={cx(styles['icon-box'], {
          [styles.collected]: info.collect,
          [styles.collecting]: isCollecting,
        })}
        onClick={handlerCollect}
        title={info.collect ? '取消收藏' : '收藏'}
      >
        <StarFilled
          className={cx(styles['star-icon'], {
            [styles.spinning]: isCollecting,
          })}
        />
      </span>

      {/* 描述区域 - 独立放在最下面，支持两行显示 */}
      <Typography.Paragraph
        className={styles['desc-section']}
        ellipsis={{ rows: 2, expandable: false, symbol: '...' }}
      >
        {getDescription()}
      </Typography.Paragraph>
    </div>
  );
};

export default AgentItem;
