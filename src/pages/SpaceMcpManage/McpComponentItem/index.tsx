import McpInstallType from '@/components/base/McpInstallType';
import McpStatus from '@/components/base/McpStatus';
import CardWrapper from '@/components/business-component/CardWrapper';
import ConditionRender from '@/components/ConditionRender';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE } from '@/constants/images.constants';
import { MCP_MORE_ACTION } from '@/constants/mcp.constants';
import {
  DeployStatusEnum,
  McpMoreActionEnum,
  McpPermissionsEnum,
} from '@/types/enums/mcp';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { McpComponentItemProps, McpDetailInfo } from '@/types/interfaces/mcp';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
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
    console.log('list', list);
    console.log('mcpInfo', mcpInfo);
    setActionList(list);
  }, [mcpInfo]);

  // 获取时间信息
  const getTime = () => {
    if (mcpInfo.deployStatus === DeployStatusEnum.Deployed) {
      return `发布于 ${dayjs(mcpInfo.deployed).format('MM-DD HH:mm')}`;
    }
    return `创建于 ${dayjs(mcpInfo.created).format('MM-DD HH:mm')}`;
  };

  return (
    <CardWrapper
      title={mcpInfo.name}
      avatar={mcpInfo.creator?.avatar || ''}
      name={mcpInfo.creator?.nickName || mcpInfo.creator?.userName}
      content={mcpInfo.description}
      icon={mcpInfo.icon}
      defaultIcon={mcpInfo.icon}
      onClick={onClick}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1', styles.time)}>
            {getTime()}
          </span>
          <McpStatus status={mcpInfo.deployStatus} />
        </>
      }
      footer={
        <footer className={cx('flex', 'items-center', 'content-between')}>
          <McpInstallType installType={mcpInfo.installType} />
          {/*更多操作*/}
          <ConditionRender condition={actionList.length > 0}>
            <CustomPopover list={actionList} onClick={onClickMore}>
              <ICON_MORE />
            </CustomPopover>
          </ConditionRender>
        </footer>
      }
    />
  );
};

export default McpComponentItem;
