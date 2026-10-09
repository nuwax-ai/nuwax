import SvgIcon from '@/components/base/SvgIcon';
import { MCP_EDIT_HEAD_MENU_LIST } from '@/constants/mcp.constants';
import { dict } from '@/services/i18nRuntime';
import {
  DeployStatusEnum,
  McpEditHeadMenusEnum,
  McpPermissionsEnum,
} from '@/types/enums/mcp';
import { McpEditHeaderProps } from '@/types/interfaces/mcp';
import { getMcpDeployStatus } from '@/utils/mcp';
import { jumpBack } from '@/utils/router';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { Button, Segmented } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 创建MCP服务header
const McpEditHeader: React.FC<McpEditHeaderProps> = ({
  spaceId,
  saveLoading,
  saveDeployLoading,
  mcpInfo,
  currentMenu,
  onChooseMenu,
  onSave,
  onSaveAndDeploy,
}) => {
  // 获取菜单是否禁用
  const getMenuDisabled = (value: McpEditHeadMenusEnum) => {
    // 如果是 Overview 菜单，直接返回 false
    if (value === McpEditHeadMenusEnum.Overview) {
      return false;
    }
    let length = 0;
    const mcpConfig = mcpInfo?.mcpConfig;
    switch (value) {
      case McpEditHeadMenusEnum.Tool:
        length = mcpConfig?.tools?.length || 0;
        break;
      case McpEditHeadMenusEnum.Resource:
        length = mcpConfig?.resources?.length || 0;
        break;
      case McpEditHeadMenusEnum.Prompt:
        length = mcpConfig?.prompts?.length || 0;
        break;
    }
    return length === 0;
  };

  // 点击菜单
  const handleClickMenu = (value: McpEditHeadMenusEnum) => {
    if (getMenuDisabled(value)) {
      return;
    }
    onChooseMenu(value);
  };

  const menuOptions = useMemo(
    () =>
      MCP_EDIT_HEAD_MENU_LIST.map((item) => ({
        label: item.label,
        value: item.value,
        disabled: getMenuDisabled(item.value),
      })),
    [mcpInfo?.mcpConfig],
  );

  return (
    <header className={cx('flex', 'content-between', styles.header)}>
      <div className={cx('flex', 'items-center', 'gap-10')}>
        <div
          className={cx('flex', 'items-center', 'cursor-pointer')}
          onClick={() => jumpBack(`/space/${spaceId}/mcp`)}
        >
          <SvgIcon
            name="icons-nav-backward"
            className={cx('hover-box', styles.icon)}
          />
          <span className={styles.name}>
            {dict('PC.Pages.SpaceMcpEdit.editMcpService')}
          </span>
        </div>
        <div className={cx('flex', 'items-center', 'gap-10')}>
          <span className={cx(styles['deploy-status'])}>
            {getMcpDeployStatus(mcpInfo?.deployStatus)}
          </span>
          {mcpInfo?.deployStatus === DeployStatusEnum.Deployed && (
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          )}
        </div>
      </div>
      <div
        className={cx(
          'flex',
          'items-center',
          'content-center',
          styles['menus-box'],
        )}
      >
        <Segmented
          className={cx(styles.segmented)}
          options={menuOptions}
          value={currentMenu}
          onChange={(value) => handleClickMenu(value as McpEditHeadMenusEnum)}
        />
      </div>
      <div className={cx('flex', 'items-center', styles['extra-box'])}>
        {/* 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布 */}
        {mcpInfo &&
          [DeployStatusEnum.Deployed, DeployStatusEnum.DeployFailed].includes(
            mcpInfo.deployStatus,
          ) &&
          mcpInfo.deployed !== null &&
          dayjs(mcpInfo.deployed).isBefore(mcpInfo.modified) && (
            <span className={cx(styles.text)}>
              {dict('PC.Pages.SpaceMcpEdit.updateNotDeployed')}
            </span>
          )}
        <Button
          className={cx({
            [styles['save-btn']]: mcpInfo?.permissions?.includes(
              McpPermissionsEnum.EditOrDeploy,
            ),
          })}
          onClick={onSave}
          loading={saveLoading}
          disabled={
            !mcpInfo?.permissions?.includes(McpPermissionsEnum.EditOrDeploy)
          }
        >
          {dict('PC.Pages.SpaceMcpEdit.save')}
        </Button>
        <Button
          type="primary"
          onClick={onSaveAndDeploy}
          loading={saveDeployLoading}
          disabled={
            !mcpInfo?.permissions?.includes(McpPermissionsEnum.EditOrDeploy)
          }
        >
          {dict('PC.Pages.SpaceMcpEdit.saveAndDeploy')}
        </Button>
      </div>
    </header>
  );
};

export default McpEditHeader;
