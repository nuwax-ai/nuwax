import agentImage from '@/assets/images/agent_image.png'; // 智能体默认图标
import shareImage from '@/assets/images/share.png';
import ConditionRender from '@/components/ConditionRender';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { AgentContentProps } from '@/types/interfaces/agentTask';
import { jumpToAgent } from '@/utils/router';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体内容
const AgentContent: React.FC<AgentContentProps> = ({
  agentDetail,
  onToggleCollectSuccess,
}) => {
  // 复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);

  const handleCopy = () => {
    message.success('复制成功');
  };

  // 智能体收藏
  const { run: runCollectAgent } = useRequest(apiCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(true);
    },
  });

  // 智能体取消收藏
  const { run: runUnCollectAgent } = useRequest(apiUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(false);
    },
  });

  // 智能体、工作流模板复制
  const { run: runCopyTemplate, loading } = useRequest(apiPublishTemplateCopy, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (
      data: number,
      params: {
        targetSpaceId: number;
        targetType: AgentComponentTypeEnum;
        targetId: number;
      }[],
    ) => {
      message.success('模板复制成功');
      // 关闭弹窗
      setOpenMove(false);
      // 目标空间ID
      const { targetSpaceId } = params[0];
      // 跳转
      jumpToAgent(targetSpaceId, data);
    },
  });

  // 切换收藏与取消收藏
  const handleToggleCollect = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (agentDetail?.collect) {
      runUnCollectAgent(agentDetail?.agentId);
    } else {
      runCollectAgent(agentDetail?.agentId);
    }
  };

  // 智能体、工作流模板复制
  const handlerConfirmCopyTemplate = (targetSpaceId: number) => {
    runCopyTemplate({
      targetType: AgentComponentTypeEnum.Agent,
      targetId: agentDetail?.agentId,
      targetSpaceId,
    });
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <img
        className={styles.avatar}
        src={agentDetail?.icon || agentImage}
        alt=""
      />
      <span className={styles.title}>{agentDetail?.name}</span>
      <ConditionRender condition={agentDetail?.description}>
        <p className={cx(styles.content)}>{agentDetail?.description}</p>
      </ConditionRender>
      <div className={cx(styles.from, 'text-ellipsis', 'w-full')}>
        来自于
        {agentDetail?.publishUser?.nickName ||
          agentDetail?.publishUser?.userName}
      </div>
      <span
        className={cx(
          styles['action-box'],
          'flex',
          'items-center',
          'content-center',
        )}
      >
        {agentDetail?.collect ? (
          <Tooltip title="取消收藏">
            <StarFilled
              className={cx(styles.collected, 'cursor-pointer')}
              onClick={handleToggleCollect}
            />
          </Tooltip>
        ) : (
          <Tooltip title="收藏">
            <StarOutlined
              className={cx(styles['un-collect'], 'cursor-pointer')}
              onClick={handleToggleCollect}
            />
          </Tooltip>
        )}
        <CopyToClipboard
          text={agentDetail?.shareLink || ''}
          onCopy={handleCopy}
        >
          <Tooltip title="分享">
            <img
              className={cx(styles.share, 'cursor-pointer')}
              src={shareImage}
              alt=""
            />
          </Tooltip>
        </CopyToClipboard>
      </span>
      <ConditionRender condition={agentDetail?.allowCopy === AllowCopyEnum.Yes}>
        <Button
          className="mt-16"
          type="primary"
          block
          onClick={() => setOpenMove(true)}
        >
          复制模板
        </Button>
        {/*智能体迁移弹窗*/}
        <MoveCopyComponent
          spaceId={agentDetail?.spaceId || 0}
          loading={loading}
          type={ApplicationMoreActionEnum.Copy_To_Space}
          open={openMove}
          isTemplate={true}
          title={agentDetail?.name}
          onCancel={() => setOpenMove(false)}
          onConfirm={handlerConfirmCopyTemplate}
        />
      </ConditionRender>
    </div>
  );
};

export default AgentContent;
