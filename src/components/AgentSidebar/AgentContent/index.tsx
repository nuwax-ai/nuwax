import agentImage from '@/assets/images/agent_image.png'; // 智能体默认图标
import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { AgentContentProps } from '@/types/interfaces/agentTask';
import { jumpToAgent } from '@/utils/router';
import { Button, message, Typography } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体内容
const AgentContent: React.FC<AgentContentProps> = ({ agentDetail }) => {
  // 复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  const [copyTemplateLoading, setCopyTemplateLoading] =
    useState<boolean>(false);

  // 智能体、工作流模板复制
  const { run: runCopyTemplate } = useRequest(apiPublishTemplateCopy, {
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
      setCopyTemplateLoading(false);
      // 关闭弹窗
      setOpenMove(false);
      // 目标空间ID
      const { targetSpaceId } = params[0];
      // 跳转
      jumpToAgent(targetSpaceId, data);
    },
    onError: () => {
      setCopyTemplateLoading(false);
    },
  });

  // 智能体、工作流模板复制
  const handlerConfirmCopyTemplate = (targetSpaceId: number) => {
    setCopyTemplateLoading(true);
    runCopyTemplate({
      targetType: AgentComponentTypeEnum.Agent,
      targetId: agentDetail?.agentId,
      targetSpaceId,
    });
  };

  if (!agentDetail) {
    return null;
  }

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <img className={styles.avatar} src={agentDetail?.icon || agentImage} />
      <Typography.Title
        level={3}
        className={styles.title}
        ellipsis={{ rows: 1, expandable: false, symbol: '...' }}
      >
        {agentDetail?.name}
      </Typography.Title>
      <div className={cx(styles.infoContainer)}>
        <Typography.Text className={cx(styles.from)} ellipsis={true}>
          来自于{' '}
          {agentDetail?.publishUser?.nickName ||
            agentDetail?.publishUser?.userName}
        </Typography.Text>
        {/* 统计信息 */}
        <div
          className={cx(
            styles.statistics,
            'flex',
            'items-center',
            'justify-center',
          )}
        >
          {/* 用户人数 */}
          <span className={cx(styles.statItem, 'flex', 'items-center')}>
            <SvgIcon name="icons-chat-user" className={styles.statIcon} />
            <span className={styles.statText}>
              {agentDetail?.statistics?.userCount || 0}
            </span>
          </span>
          {/* 会话次数 */}
          <span className={cx(styles.statItem, 'flex', 'items-center')}>
            <SvgIcon name="icons-chat-chat" className={styles.statIcon} />
            <span className={styles.statText}>
              {agentDetail?.statistics?.convCount || 0}
            </span>
          </span>
          {/* 收藏次数 */}
          <span className={cx(styles.statItem, 'flex', 'items-center')}>
            <SvgIcon name="icons-chat-collect" className={styles.statIcon} />
            <span className={styles.statText}>
              {agentDetail?.statistics?.collectCount || 0}
            </span>
          </span>
        </div>
        <ConditionRender condition={agentDetail?.description}>
          <Typography.Paragraph
            className={cx(styles.content)}
            ellipsis={{ rows: 2, expandable: false, symbol: '...' }}
          >
            {agentDetail?.description}
          </Typography.Paragraph>
        </ConditionRender>
        <ConditionRender
          condition={agentDetail?.allowCopy === AllowCopyEnum.Yes}
        >
          <Button
            color="primary"
            size="large"
            variant="filled"
            icon={<SvgIcon name="icons-chat-copy" />}
            className={cx(styles.copyBtn)}
            onClick={() => setOpenMove(true)}
          >
            复制模板
          </Button>
          {/*智能体迁移弹窗*/}
          <MoveCopyComponent
            spaceId={agentDetail?.spaceId || 0}
            loading={copyTemplateLoading}
            type={ApplicationMoreActionEnum.Copy_To_Space}
            open={openMove}
            isTemplate={true}
            title={agentDetail?.name}
            onCancel={() => setOpenMove(false)}
            onConfirm={handlerConfirmCopyTemplate}
          />
        </ConditionRender>
      </div>
    </div>
  );
};

export default AgentContent;
