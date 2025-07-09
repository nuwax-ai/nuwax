import agentImage from '@/assets/images/agent_image.png';
import foldImage from '@/assets/images/fold_image.png';
import ConditionRender from '@/components/ConditionRender';
import { PermissionsEnum } from '@/types/enums/common';
import type { AgentHeaderProps } from '@/types/interfaces/agentConfig';
import { jumpBack } from '@/utils/router';
import {
  ClockCircleOutlined,
  FormOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 编辑智能体顶部header
 */
const AgentHeader: React.FC<AgentHeaderProps> = ({
  agentConfigInfo,
  onToggleShowStand,
  onToggleVersionHistory,
  onEditAgent,
  onPublish,
}) => {
  const { spaceId } = useParams();

  // 发布按钮是否禁用
  const disabledBtn = useMemo(() => {
    if (agentConfigInfo) {
      return !agentConfigInfo?.permissions?.includes(PermissionsEnum.Publish);
    } else {
      return false;
    }
  }, [agentConfigInfo]);

  return (
    <header
      className={cx(
        'flex',
        'items-center',
        'px-16',
        'py-16',
        'relative',
        styles.header,
      )}
    >
      <LeftOutlined
        className={cx('hover-box')}
        onClick={() => jumpBack(`/space/${spaceId}/develop`)}
      />
      <img
        className={cx('radius-6', styles.avatar)}
        src={agentConfigInfo?.icon || (agentImage as string)}
        alt=""
      />
      <div className={cx('flex', 'flex-col', styles['header-info'])}>
        <div className={cx('flex', 'items-center')}>
          <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
            {agentConfigInfo?.name}
          </h3>
          <FormOutlined
            className={cx(styles['edit-ico'])}
            onClick={onEditAgent}
          />
          {/* 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布 */}
          {agentConfigInfo?.publishDate !== null &&
            moment(agentConfigInfo?.publishDate).isBefore(
              agentConfigInfo?.modified,
            ) && (
              <Tag
                bordered={false}
                color="volcano"
                style={{ marginLeft: '6px' }}
              >
                有更新未发布
              </Tag>
            )}
        </div>
        <div className={cx('flex', 'items-center', styles['agent-rel-info'])}>
          <ConditionRender condition={agentConfigInfo?.space?.icon}>
            <img src={agentConfigInfo?.space?.icon} alt="" />
          </ConditionRender>
          <span className={cx(styles['space-name'], 'text-ellipsis')}>
            {agentConfigInfo?.space?.name}
          </span>
          <span className={cx(styles['save-time'])}>
            草稿自动保存于{moment(agentConfigInfo?.modified).format('HH:mm')}
          </span>
        </div>
      </div>
      <h2 className={cx('absolute', styles['header-title'])}>编排</h2>
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <img
          src={foldImage as string}
          className={cx('cursor-pointer', styles.fold)}
          onClick={onToggleShowStand}
          alt=""
        />
        <ClockCircleOutlined
          className={cx(styles.ico, 'cursor-pointer')}
          onClick={onToggleVersionHistory}
        />
        <Button
          type="primary"
          className={cx(styles['publish-btn'])}
          onClick={onPublish}
          disabled={disabledBtn}
        >
          发布
        </Button>
      </div>
    </header>
  );
};

export default AgentHeader;
