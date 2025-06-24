import { MCP_EDIT_HEAD_MENU_LIST } from '@/constants/mcp.constants';
import { DeployStatusEnum, McpEditHeadMenusEnum } from '@/types/enums/mcp';
import { McpEditHeaderProps } from '@/types/interfaces/mcp';
import { getMcpDeployStatus } from '@/utils/mcp';
import { jumpBack } from '@/utils/router';
import { CheckCircleTwoTone, LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
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

  return (
    <header className={cx('flex', 'content-between', styles.header)}>
      <div className={cx('flex', 'items-center', 'gap-10')}>
        <div
          className={cx('flex', 'items-center', 'cursor-pointer')}
          onClick={() => jumpBack(`/space/${spaceId}/mcp`)}
        >
          <LeftOutlined className={cx('hover-box')} />
          <span className={styles.name}>编辑MCP服务</span>
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
        {MCP_EDIT_HEAD_MENU_LIST.map((item) => {
          return (
            <div
              key={item.value}
              className={cx('cursor-pointer', styles['head-menu'], {
                [styles['active']]: currentMenu === item.value,
                [styles.disabled]: getMenuDisabled(item.value),
              })}
              onClick={() => handleClickMenu(item.value)}
            >
              {item.label}
            </div>
          );
        })}
      </div>
      <div className={cx('flex', 'items-center', styles['extra-box'])}>
        {/* 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布 */}
        {mcpInfo?.deployed !== null &&
          moment(mcpInfo?.deployed).isBefore(mcpInfo?.modified) && (
            <span className={cx(styles.text)}>有更新未部署</span>
          )}
        <Button
          className={cx(styles['save-btn'])}
          onClick={onSave}
          loading={saveLoading}
        >
          保存
        </Button>
        <Button
          type="primary"
          onClick={onSaveAndDeploy}
          loading={saveDeployLoading}
        >
          保存并部署
        </Button>
      </div>
    </header>
  );
};

export default McpEditHeader;
