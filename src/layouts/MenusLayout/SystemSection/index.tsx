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

  // 模板menu显隐，默认打开模板menu
  const [visibleMenu, setVisibleMenu] = useState<boolean>(true);

  const handlerApplication = (type: SystemManageListEnum | string) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();
    switch (type) {
      // 用户管理
      case SystemManageListEnum.User_Manage:
        history.push('/system/user/manage');
        break;
      // 发布审核
      case SystemManageListEnum.Publish_Audit:
        history.push('/system/publish/audit');
        break;
      // 已发布管理
      case SystemManageListEnum.Published_Manage:
        history.push('/system/published/manage');
        break;
      // 全局模型管理
      case SystemManageListEnum.Global_Model_Manage:
        history.push('/system/model/manage');
        break;
      // 系统配置
      case SystemManageListEnum.System_Config:
        history.push('/system/config');
        break;
      // 主题配置
      case SystemManageListEnum.Theme_Config:
        history.push('/system/theme/config');
        break;
      // Markdown 测试
      case 'markdown-test':
        history.push('/markdown-test');
        break;
      // 系统概览
      case SystemManageListEnum.Dashboard:
        history.push('/system/dashboard');
        break;
    }
  };

  // 点击模板列表项
  const handlerSubApplication = (type: SystemManageListEnum | number) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();

    switch (type) {
      case SystemManageListEnum.Operation_Log:
        history.push('/system/log-query/operation-log', { _t: Date.now() });
        break;
      case SystemManageListEnum.Running_Log:
        history.push('/system/log-query/running-log', { _t: Date.now() });
        break;
      case SystemManageListEnum.Content_Space:
        history.push('/system/content/content-space');
        break;
      case SystemManageListEnum.Content_Agent:
        history.push('/system/content/content-agent');
        break;
      case SystemManageListEnum.Content_WebApplication:
        history.push('/system/content/content-web-application');
        break;
      case SystemManageListEnum.Content_KnowledgeBase:
        history.push('/system/content/content-knowledge-base');
        break;
      case SystemManageListEnum.Content_DataTable:
        history.push('/system/content/content-data-table');
        break;
      case SystemManageListEnum.Content_Workflow:
        history.push('/system/content/content-workflow');
        break;
      case SystemManageListEnum.Content_Plugin:
        history.push('/system/content/content-plugin');
        break;
      case SystemManageListEnum.Content_Mcp:
        history.push('/system/content/content-mcp');
        break;
      case SystemManageListEnum.Content_Skill:
        history.push('/system/content/content-skill');
        break;
      // 权限资源
      case SystemManageListEnum.Permission_Resources:
        history.push('/system/menu-permission/permission-resources');
        break;
      // 菜单管理
      case SystemManageListEnum.Menu_Manage:
        history.push('/system/menu-permission/menu-manage');
        break;
      // 角色管理
      case SystemManageListEnum.Role_Manage:
        history.push('/system/menu-permission/role-manage');
        break;
      // 用户组管理
      case SystemManageListEnum.User_Group_Manage:
        history.push('/system/menu-permission/user-group-manage');
        break;
    }
  };

  // 判断是否active
  const handleActive = (type: SystemManageListEnum | string) => {
    return (
      (type === SystemManageListEnum.Publish_Audit &&
        pathname.includes('audit')) ||
      (type === SystemManageListEnum.User_Manage &&
        pathname.includes('user')) ||
      (type === SystemManageListEnum.Published_Manage &&
        pathname.includes('published')) ||
      (type === SystemManageListEnum.Global_Model_Manage &&
        pathname.includes('model')) ||
      (type === SystemManageListEnum.System_Config &&
        pathname.includes('config') &&
        !pathname.includes('theme')) ||
      (type === SystemManageListEnum.Theme_Config &&
        pathname.includes('theme/config')) ||
      (type === 'markdown-test' && pathname.includes('markdown-test')) ||
      (type === SystemManageListEnum.Dashboard &&
        pathname.includes('dashboard')) ||
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
        pathname.includes('content-skill'))
    );
  };

  return (
    <div style={style}>
      {SYSTEM_MANAGE_LIST.map((info, index) => (
        <React.Fragment key={info.type}>
          <SecondMenuItem
            name={info.text}
            isDown={!!info.list?.length}
            isActive={handleActive(info.type)}
            isOpen={visibleMenu}
            icon={info.icon}
            onClick={() => handlerApplication(info.type)}
            onToggle={() => setVisibleMenu(!visibleMenu)}
            isFirst={index === 0}
          />
          {/* 模板列表项 */}
          <ConditionRender condition={!!info.list?.length}>
            <div
              className={cx(styles['box-hidden'], {
                [styles.visible]: visibleMenu,
              })}
            >
              {info.list?.map((item: any) => (
                <SecondMenuItem.SubItem
                  key={item.type}
                  name={item.text}
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
