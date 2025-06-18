import avatar from '@/assets/images/avatar.png';
import CustomPopover from '@/components/CustomPopover';
import { MCP_MORE_ACTION } from '@/constants/mcp.constants';
import { DeployStatusEnum } from '@/types/enums/mcp';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { McpComponentItemProps } from '@/types/interfaces/mcp';
import { CheckCircleTwoTone, MoreOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import BoxInfo from './BoxInfo';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const McpComponentItem: React.FC<McpComponentItemProps> = ({
  info,
  onClick,
  onClickMore,
}) => {
  // 更多操作列表
  const [actionList, setActionList] = useState<CustomPopoverItem[]>([]);

  useEffect(() => {
    setActionList(MCP_MORE_ACTION);
  }, []);

  return (
    <div
      className={cx(
        styles.container,
        'py-12',
        'radius-6',
        'flex',
        'flex-col',
        'content-between',
        'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className={cx('flex', 'content-between', styles.header)}>
        <div
          className={cx(
            'flex-1',
            'flex',
            'flex-col',
            'content-around',
            'overflow-hide',
          )}
        >
          <h3 className={cx('text-ellipsis', styles['plugin-name'])}>
            {info.name}
          </h3>
          <p className={cx('text-ellipsis', styles.desc)}>{info.description}</p>
        </div>
        <img className={cx(styles.img)} src={info.icon} alt="" />
      </div>
      {/*插件类型*/}
      <div
        className={cx('flex', 'flex-wrap', 'items-center', styles['type-wrap'])}
      >
        <BoxInfo icon={info?.icon} text={info?.name} />
        {info.deployStatus === DeployStatusEnum.Deployed && (
          <>
            <BoxInfo text="已发布" />
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </>
        )}
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <img
          className={cx(styles.img, 'radius-6')}
          src={info?.creator?.avatar || avatar}
          alt=""
        />
        <div className={cx('flex-1', 'flex', 'item-center', 'overflow-hide')}>
          <div className={cx('flex-1', 'text-ellipsis')}>
            {info.creator?.nickName || info.creator?.userName}
          </div>
          <div className={cx(styles['edit-time'], 'text-ellipsis')}>
            最近编辑 {moment(info.modified).format('MM-DD HH:mm')}
          </div>
        </div>
        <CustomPopover list={actionList} onClick={onClickMore}>
          <span
            className={cx(
              styles['icon-box'],
              'flex',
              'content-center',
              'items-center',
              'hover-box',
            )}
          >
            <MoreOutlined />
          </span>
        </CustomPopover>
      </div>
    </div>
  );
};

export default McpComponentItem;
