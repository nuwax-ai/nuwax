import SecondMenuItem from '@/components/base/SecondMenuItem';
import ConditionRender from '@/components/ConditionRender';
import { SYSTEM_MANAGE_LIST } from '@/constants/system.constants';
import { SystemManageListEnum } from '@/types/enums/systemManage';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import styles from './index.less';
const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const SystemSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const location = useLocation();
  const { pathname } = location;
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // Find the key that should be open based on current path
  const getInitialOpenKey = () => {
    for (const item of SYSTEM_MANAGE_LIST) {
      if (item.list && item.list.length > 0) {
        // Check if any sub-item matches the current path
        // We can reuse a logic similar to handleSubActive but simplified or just check if pathname includes the parent's context
        // OR, stick to the `handleSubActive` logic which is item-specific.
        // A simple check: if any of the sub-items would be active, then this parent is the openKey.
        const isChildActive = item.list.some((subItem: any) => {
          return (
            (subItem.type === SystemManageListEnum.Operation_Log &&
              pathname.includes('operation-log')) ||
            (subItem.type === SystemManageListEnum.Running_Log &&
              pathname.includes('running-log')) ||
            (subItem.type === SystemManageListEnum.Content_Space &&
              pathname.includes('content-space')) ||
            (subItem.type === SystemManageListEnum.Content_Agent &&
              pathname.includes('content-agent')) ||
            (subItem.type === SystemManageListEnum.Content_WebApplication &&
              pathname.includes('content-web-application')) ||
            (subItem.type === SystemManageListEnum.Content_KnowledgeBase &&
              pathname.includes('content-knowledge-base')) ||
            (subItem.type === SystemManageListEnum.Content_DataTable &&
              pathname.includes('content-data-table')) ||
            (subItem.type === SystemManageListEnum.Content_Workflow &&
              pathname.includes('content-workflow')) ||
            (subItem.type === SystemManageListEnum.Content_Plugin &&
              pathname.includes('content-plugin')) ||
            (subItem.type === SystemManageListEnum.Content_Mcp &&
              pathname.includes('content-mcp')) ||
            (subItem.type === SystemManageListEnum.Content_Skill &&
              pathname.includes('content-skill')) ||
            (subItem.type === SystemManageListEnum.Permission_Resources &&
              pathname.includes('permission-resources')) ||
            (subItem.type === SystemManageListEnum.Menu_Manage &&
              pathname.includes('menu-manage')) ||
            (subItem.type === SystemManageListEnum.Role_Manage &&
              pathname.includes('role-manage')) ||
            (subItem.type === SystemManageListEnum.User_Group_Manage &&
              pathname.includes('user-group-manage')) ||
            (subItem.type === SystemManageListEnum.System_Setting &&
              pathname.includes('config/setting')) ||
            (subItem.type === SystemManageListEnum.Theme_Config &&
              pathname.includes('config/theme')) ||
            (subItem.type === SystemManageListEnum.Sandbox_Config &&
              pathname.includes('config/sandbox')) ||
            (subItem.type === SystemManageListEnum.Category_Manage &&
              pathname.includes('config/category'))
          );
        });
        if (isChildActive) return item.type;
      }
    }
    return null;
  };

  // 模板menu显隐，手风琴模式，仅允许一个展开
  const [openKey, setOpenKey] = useState<SystemManageListEnum | string | null>(
    getInitialOpenKey,
  );

  const handleToggle = (key: SystemManageListEnum | string) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  const handlerApplication = (info: any) => {
    const type = info.type;
    const hasChildren = !!info.list?.length;

    // 如果有子菜单，点击标题进行折叠/展开
    if (hasChildren) {
      handleToggle(type);
      return;
    }

    // 关闭移动端菜单
    handleCloseMobileMenu();
    // 如果点击的是没有子菜单的项目，关闭所有展开项（可选，根据需求，这里保持关闭以突出手风琴效果）
    setOpenKey(null);

    switch (type) {
      // 用户管理
      case SystemManageListEnum.User_Manage:
        history.push('/system/user/manage', { _t: Date.now() });
        break;
      // 发布审核
      case SystemManageListEnum.Publish_Audit:
        history.push('/system/publish/audit', { _t: Date.now() });
        break;
      // 已发布管理
      case SystemManageListEnum.Published_Manage:
        history.push('/system/published/manage', { _t: Date.now() });
        break;
      // 全局模型管理
      case SystemManageListEnum.Global_Model_Manage:
        history.push('/system/model/manage', { _t: Date.now() });
        break;
      // 系统配置
      case SystemManageListEnum.System_Config:
        history.push('/system/config', { _t: Date.now() });
        break;
      // Markdown 测试
      case 'markdown-test':
        history.push('/markdown-test');
        break;
      // 系统概览
      case SystemManageListEnum.Dashboard:
        history.push('/system/dashboard', { _t: Date.now() });
        break;
      // 任务管理
      case SystemManageListEnum.Task_Manage:
        history.push('/system/task-manage', { _t: Date.now() });
        break;
    }
  };

  // 点击模板列表项
  const handlerSubApplication = (type: SystemManageListEnum | number) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();

    switch (type) {
      case SystemManageListEnum.System_Setting:
        history.push('/system/config/setting', { _t: Date.now() });
        break;
      case SystemManageListEnum.Theme_Config:
        history.push('/system/config/theme', { _t: Date.now() });
        break;
      case SystemManageListEnum.Sandbox_Config:
        history.push('/system/config/sandbox', { _t: Date.now() });
        break;
      case SystemManageListEnum.Category_Manage:
        history.push('/system/config/category', { _t: Date.now() });
        break;
      case SystemManageListEnum.Operation_Log:
        history.push('/system/log-query/operation-log', { _t: Date.now() });
        break;
      case SystemManageListEnum.Running_Log:
        history.push('/system/log-query/running-log', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_Space:
        history.push('/system/content/content-space', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_Agent:
        history.push('/system/content/content-agent', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_WebApplication:
        history.push('/system/content/content-web-application', {
          _t: Date.now(),
        });
        break;
      case SystemManageListEnum.Content_KnowledgeBase:
        history.push('/system/content/content-knowledge-base', {
          _t: Date.now(),
        });
        break;
      case SystemManageListEnum.Content_DataTable:
        history.push('/system/content/content-data-table', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_Workflow:
        history.push('/system/content/content-workflow', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_Plugin:
        history.push('/system/content/content-plugin', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_Mcp:
        history.push('/system/content/content-mcp', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_Skill:
        history.push('/system/content/content-skill', { _t: Date.now() });
        break;
      // 权限资源
      case SystemManageListEnum.Permission_Resources:
        history.push('/system/menu-permission/permission-resources', {
          _t: Date.now(),
        });
        break;
      // 菜单管理
      case SystemManageListEnum.Menu_Manage:
        history.push('/system/menu-permission/menu-manage', { _t: Date.now() });
        break;
      // 角色管理
      case SystemManageListEnum.Role_Manage:
        history.push('/system/menu-permission/role-manage', { _t: Date.now() });
        break;
      // 用户组管理
      case SystemManageListEnum.User_Group_Manage:
        history.push('/system/menu-permission/user-group-manage', {
          _t: Date.now(),
        });
        break;
    }
  };

  // 判断是否active
  const handleActive = (type: SystemManageListEnum | string) => {
    return (
      (type === SystemManageListEnum.Publish_Audit &&
        pathname.includes('audit')) ||
      (type === SystemManageListEnum.User_Manage &&
        pathname.includes('/user/manage')) ||
      (type === SystemManageListEnum.Published_Manage &&
        pathname.includes('published')) ||
      (type === SystemManageListEnum.Global_Model_Manage &&
        pathname.includes('model')) ||
      (type === SystemManageListEnum.System_Config &&
        pathname.includes('config')) ||
      (type === 'markdown-test' && pathname.includes('markdown-test')) ||
      (type === SystemManageListEnum.Dashboard &&
        pathname.includes('dashboard')) ||
      (type === SystemManageListEnum.Task_Manage &&
        pathname.includes('task-manage')) ||
      (type === SystemManageListEnum.Log_Query &&
        pathname.includes('log-query')) ||
      (type === SystemManageListEnum.Content && pathname.includes('content'))
    );
  };
  // 判断是否sub active
  const handleSubActive = (type: SystemManageListEnum | string) => {
    return (
      (type === SystemManageListEnum.Operation_Log &&
        pathname.includes('operation-log')) ||
      (type === SystemManageListEnum.Running_Log &&
        pathname.includes('running-log')) ||
      (type === SystemManageListEnum.Content_Space &&
        pathname.includes('content-space')) ||
      (type === SystemManageListEnum.Content_Agent &&
        pathname.includes('content-agent')) ||
      (type === SystemManageListEnum.Content_WebApplication &&
        pathname.includes('content-web-application')) ||
      (type === SystemManageListEnum.Content_KnowledgeBase &&
        pathname.includes('content-knowledge-base')) ||
      (type === SystemManageListEnum.Content_DataTable &&
        pathname.includes('content-data-table')) ||
      (type === SystemManageListEnum.Content_Workflow &&
        pathname.includes('content-workflow')) ||
      (type === SystemManageListEnum.Content_Plugin &&
        pathname.includes('content-plugin')) ||
      (type === SystemManageListEnum.Content_Mcp &&
        pathname.includes('content-mcp')) ||
      (type === SystemManageListEnum.Content_Skill &&
        pathname.includes('content-skill')) ||
      (type === SystemManageListEnum.Permission_Resources &&
        pathname.includes('permission-resources')) ||
      (type === SystemManageListEnum.Menu_Manage &&
        pathname.includes('menu-manage')) ||
      (type === SystemManageListEnum.Role_Manage &&
        pathname.includes('role-manage')) ||
      (type === SystemManageListEnum.User_Group_Manage &&
        pathname.includes('user-group-manage')) ||
      (type === SystemManageListEnum.System_Setting &&
        pathname.includes('config/setting')) ||
      (type === SystemManageListEnum.Theme_Config &&
        pathname.includes('config/theme')) ||
      (type === SystemManageListEnum.Sandbox_Config &&
        pathname.includes('config/sandbox')) ||
      (type === SystemManageListEnum.Category_Manage &&
        pathname.includes('config/category'))
    );
  };

  return (
    <div style={style}>
      {SYSTEM_MANAGE_LIST.map((info) => (
        <React.Fragment key={info.type}>
          <SecondMenuItem
            name={info.text}
            isDown={!!info.list?.length}
            isActive={handleActive(info.type)}
            isOpen={openKey === info.type}
            icon={info.icon}
            onClick={() => handlerApplication(info)}
            onToggle={() => handleToggle(info.type)}
          />
          {/* 模板列表项 */}
          <ConditionRender condition={!!info.list?.length}>
            <div
              className={cx(styles['box-hidden'], {
                [styles.visible]: openKey === info.type,
              })}
            >
              {info.list?.map((item: any) => (
                <SecondMenuItem.SubItem
                  key={item.type}
                  name={item.text}
                  icon={item.icon}
                  isActive={handleSubActive(item.type)}
                  onClick={() => handlerSubApplication(item.type)}
                />
              ))}
            </div>
          </ConditionRender>
        </React.Fragment>
      ))}
    </div>
  );
};
export default SystemSection;
