import agentImage from '@/assets/images/agent_image.png';
import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import { APPLICATION_MORE_ACTION_DETAIL } from '@/constants/space.constants';
import { PermissionsEnum } from '@/types/enums/common';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { AgentHeaderProps } from '@/types/interfaces/agentConfig';
// import { jumpBack } from '@/utils/router';
import { FormOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { history, useParams } from 'umi';
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
  onOtherAction,
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

  // 提取权限检查逻辑
  const hasPermission = (permission: PermissionsEnum) => {
    return agentConfigInfo?.permissions?.includes(permission);
  };

  // 更多操作列表
  const actionList = useMemo(() => {
    return APPLICATION_MORE_ACTION_DETAIL.filter((item) => {
      const type = item.type as ApplicationMoreActionEnum;

      switch (type) {
        // 临时会话
        case ApplicationMoreActionEnum.Temporary_Session:
          return hasPermission(PermissionsEnum.TempChat);
        case ApplicationMoreActionEnum.Export_Config:
          // 导出配置操作：只有空间创建者、空间管理员和智能体本身的创建者可导出
          return hasPermission(PermissionsEnum.Export);
        default:
          // 其他操作默认展示
          return true;
      }
    }).map((item) => {
      return {
        key: item.type,
        label: (
          <div
            onClick={() => {
              onOtherAction(item.type as ApplicationMoreActionEnum);
            }}
          >
            {item.label}
          </div>
        ),
      };
    });
  }, [agentConfigInfo]);

  const items: MenuProps['items'] = [
    {
      key: 'showStand',
      label: <div onClick={onToggleShowStand}>展示台</div>,
    },
    {
      key: 'versionHistory',
      label: <div onClick={onToggleVersionHistory}>版本历史</div>,
    },
    ...actionList,
  ];

  return (
    <header className={cx('flex', 'items-center', 'relative', styles.header)}>
      <SvgIcon
        name="icons-nav-backward"
        className={cx(styles['icon-backward'])}
        onClick={() => {
          history.push(`/space/${spaceId}/develop`);
          // jumpBack(`/space/${spaceId}/develop`)
        }}
      />
      <img
        className={cx(styles.avatar)}
        src={agentConfigInfo?.icon || (agentImage as string)}
        alt=""
      />
      <div className={cx('flex', 'flex-col', styles['header-info'])}>
        <div className={cx('flex', 'items-center')}>
          <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
            {agentConfigInfo?.name}
          </h3>

          <div className={cx('flex', 'items-center', styles['agent-rel-info'])}>
            <ConditionRender condition={agentConfigInfo?.space?.icon}>
              <img src={agentConfigInfo?.space?.icon} alt="" />
            </ConditionRender>
            <span className={cx(styles['space-name'], 'text-ellipsis')}>
              {agentConfigInfo?.space?.name}
            </span>
          </div>

          <FormOutlined
            className={cx(styles['edit-ico'])}
            onClick={onEditAgent}
          />
        </div>
      </div>
      {/* <h2 className={cx('absolute', styles['header-title'])}>编排</h2> */}
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <div className={cx('flex', 'items-center', styles['save-time-box'])}>
          <span className={cx(styles['save-time'])}>
            草稿自动保存于&nbsp;
            {dayjs(agentConfigInfo?.modified).format('HH:mm')}
          </span>
          {/* 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布 */}
          {agentConfigInfo?.publishDate !== null &&
            dayjs(agentConfigInfo?.publishDate).isBefore(
              agentConfigInfo?.modified,
            ) && (
              <Tag
                bordered={false}
                color="volcano"
                className={cx(styles['volcano'])}
              >
                有更新未发布
              </Tag>
            )}
        </div>
        <div className={cx(styles['fold-box'])}>
          <Dropdown menu={{ items }} placement="bottomLeft">
            <span
              className={cx(
                'flex',
                'items-center',
                'cursor-pointer',
                styles['fold-btn'],
              )}
            >
              <SvgIcon name="icons-common-more" />
            </span>
          </Dropdown>
        </div>
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
