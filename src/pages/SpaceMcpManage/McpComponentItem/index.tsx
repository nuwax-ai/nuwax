import avatar from '@/assets/images/avatar.png';
import CustomPopover from '@/components/CustomPopover';
import { MCP_MORE_ACTION } from '@/constants/mcp.constants';
import {
  DeployStatusEnum,
  McpInstallTypeEnum,
  McpMoreActionEnum,
  McpPermissionsEnum,
} from '@/types/enums/mcp';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { McpComponentItemProps, McpDetailInfo } from '@/types/interfaces/mcp';
import { getMcpDeployStatus } from '@/utils/mcp';
import { CheckCircleTwoTone, MoreOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import BoxInfo from './BoxInfo';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const McpComponentItem: React.FC<McpComponentItemProps> = ({
  mcpInfo,
  onClick,
  onClickMore,
}) => {
  // 更多操作列表
  const [actionList, setActionList] = useState<CustomPopoverItem[]>([]);

  // 获取更多操作列表
  const getActionList = useCallback((info: McpDetailInfo) => {
    const list: CustomPopoverItem[] = [];
    // 权限控制
    MCP_MORE_ACTION.forEach((item) => {
      // 删除按钮: 只有当前用户拥有删除权限，并且mcp已停止的服务才可删除
      if (
        item.type === McpMoreActionEnum.Del &&
        info.permissions?.includes(McpPermissionsEnum.Delete)
      ) {
        list.push(item);
      }
      // 停止服务按钮: 只有当前用户拥有停止权限，才可停止服务
      if (
        item.type === McpMoreActionEnum.Stop_Service &&
        info.deployStatus !== DeployStatusEnum.Stopped &&
        info.permissions?.includes(McpPermissionsEnum.Stop)
      ) {
        list.push(item);
      }
      // 导出服务按钮: 只有当前用户拥有导出权限，才可导出服务(mcp操作服务停止后，不应该展示“服务导出”)
      if (
        item.type === McpMoreActionEnum.Service_Export &&
        info.deployStatus !== DeployStatusEnum.Stopped &&
        info.permissions?.includes(McpPermissionsEnum.Export)
      ) {
        list.push(item);
      }
    });
    return list;
  }, []);

  useEffect(() => {
    const list = getActionList(mcpInfo);
    setActionList(list);
  }, [mcpInfo]);

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
          <h3 className={cx('text-ellipsis', styles.name)}>{mcpInfo.name}</h3>
          <p className={cx('text-ellipsis', styles.desc)}>
            {mcpInfo.description}
          </p>
        </div>
        <img className={cx(styles.img)} src={mcpInfo.icon} alt="" />
      </div>
      {/*插件类型*/}
      <div
        className={cx('flex', 'flex-wrap', 'items-center', styles['type-wrap'])}
      >
        <BoxInfo
          text={
            mcpInfo?.installType === McpInstallTypeEnum.COMPONENT
              ? '组件库'
              : mcpInfo?.installType
          }
        />
        <BoxInfo text={getMcpDeployStatus(mcpInfo.deployStatus)} />
        {mcpInfo.deployStatus === DeployStatusEnum.Deployed && (
          <CheckCircleTwoTone twoToneColor="#52c41a" />
        )}
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <img
          className={cx(styles.img, 'radius-6')}
          src={mcpInfo?.creator?.avatar || avatar}
          alt=""
        />
        <div className={cx('flex-1', 'flex', 'item-center', 'overflow-hide')}>
          <div className={cx('text-ellipsis', styles['user-name'])}>
            {mcpInfo.creator?.nickName || mcpInfo.creator?.userName}
          </div>
          <div className={cx(styles.time, 'text-ellipsis')}>
            {mcpInfo.deployStatus === DeployStatusEnum.Deployed
              ? `发布于 ${moment(mcpInfo.deployed).format('MM-DD HH:mm')}`
              : `创建于 ${moment(mcpInfo.created).format('MM-DD HH:mm')}`}
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
