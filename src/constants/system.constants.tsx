import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import {
  MessageScopeEnum,
  SystemManageListEnum,
} from '@/types/enums/systemManage';
import { TabsProps } from 'antd';

// 系统管理应用列表（layout二级菜单）
export const SYSTEM_MANAGE_LIST = [
  {
    type: SystemManageListEnum.User_Manage,
    icon: <SvgIcon name="icons-nav-user" />,
    text: dict('PC.Constants.System.userManage'),
  },
  {
    type: SystemManageListEnum.Publish_Audit,
    icon: <SvgIcon name="icons-nav-publish_audit" />,
    text: dict('PC.Constants.System.publishAudit'),
  },
  {
    type: SystemManageListEnum.Published_Manage,
    icon: <SvgIcon name="icons-nav-publish_manage" />,
    text: dict('PC.Constants.System.publishedManage'),
  },
  {
    type: SystemManageListEnum.Global_Model_Manage,
    icon: <SvgIcon name="icons-nav-model" />,
    text: dict('PC.Constants.System.globalModelManage'),
  },
  {
    type: SystemManageListEnum.System_Config,
    icon: <SvgIcon name="icons-nav-settings" />,
    text: dict('PC.Constants.System.systemConfig'),
    list: [
      {
        text: dict('PC.Constants.System.systemSetting'),
        type: SystemManageListEnum.System_Setting,
      },
      {
        text: dict('PC.Constants.System.themeConfig'),
        type: SystemManageListEnum.Theme_Config,
      },
      {
        text: dict('PC.Constants.System.sandboxConfig'),
        type: SystemManageListEnum.Sandbox_Config,
      },
      {
        text: dict('PC.Constants.System.categoryManage'),
        type: SystemManageListEnum.Category_Manage,
      },
    ],
  },
  {
    type: SystemManageListEnum.Dashboard,
    icon: <SvgIcon name="icons-nav-dashboard" />,
    text: dict('PC.Constants.System.systemOverview'),
  },
  {
    type: SystemManageListEnum.Task_Manage,
    icon: <SvgIcon name="icons-nav-task-time" />,
    text: dict('PC.Constants.System.taskManage'),
  },
  {
    type: SystemManageListEnum.MenuPermission,
    icon: <SvgIcon name="icons-nav-permission" />,
    text: dict('PC.Constants.System.menuPermission'),
    list: [
      {
        text: dict('PC.Constants.System.permissionResources'),
        type: SystemManageListEnum.Permission_Resources,
      },
      {
        text: dict('PC.Constants.System.menuManage'),
        type: SystemManageListEnum.Menu_Manage,
      },
      {
        text: dict('PC.Constants.System.roleManage'),
        type: SystemManageListEnum.Role_Manage,
      },
      {
        text: dict('PC.Constants.System.userGroupManage'),
        type: SystemManageListEnum.User_Group_Manage,
      },
    ],
  },
  {
    type: SystemManageListEnum.Log_Query,
    icon: <SvgIcon name="icons-nav-log" />,
    text: dict('PC.Constants.Space.logQuery'),
    list: [
      // {
      //   text: '操作日志',
      //   type: SystemManageListEnum.Operation_Log,
      //   // icon: <SvgIcon name="icons-nav-log-operation" />,
      // },
      {
        text: dict('PC.Constants.System.runningLog'),
        type: SystemManageListEnum.Running_Log,
        // icon: <SvgIcon name="icons-nav-log-running" />,
      },
    ],
  },
  {
    type: SystemManageListEnum.Content,
    icon: <SvgIcon name="icons-nav-cube" />,
    text: dict('PC.Constants.System.contentManage'),
    list: [
      {
        text: dict('PC.Constants.System.contentSpace'),
        type: SystemManageListEnum.Content_Space,
      },
      {
        text: dict('PC.Common.Global.agent'),
        type: SystemManageListEnum.Content_Agent,
      },
      {
        text: dict('PC.Constants.Ecosystem.webApp'),
        type: SystemManageListEnum.Content_WebApplication,
      },
      {
        text: dict('PC.Common.Global.knowledge'),
        type: SystemManageListEnum.Content_KnowledgeBase,
      },
      {
        text: dict('PC.Common.Global.dataTable'),
        type: SystemManageListEnum.Content_DataTable,
      },
      {
        text: dict('PC.Common.Global.workflow'),
        type: SystemManageListEnum.Content_Workflow,
      },
      {
        text: dict('PC.Common.Global.plugin'),
        type: SystemManageListEnum.Content_Plugin,
      },
      {
        text: 'MCP',
        type: SystemManageListEnum.Content_Mcp,
      },
      {
        text: dict('PC.Common.Global.skill'),
        type: SystemManageListEnum.Content_Skill,
      },
    ],
  },
];

// 消息类型, Broadcast时可以不传userIds,可用值:Broadcast,Private,System
export const MESSAGE_SCOPE_OPTIONS = [
  {
    label: dict('PC.Constants.System.sendToSpecifiedUser'),
    value: MessageScopeEnum.Broadcast,
  },
  {
    label: dict('PC.Constants.System.systemMessageAllUsers'),
    value: MessageScopeEnum.System,
  },
];

// 系统配置页面tab
export const SYSTEM_SETTING_TABS: TabsProps['items'] = [
  {
    key: 'BaseConfig',
    label: dict('PC.Constants.System.baseConfig'),
  },
  {
    key: 'ModelSetting',
    label: dict('PC.Constants.System.defaultModelSetting'),
  },
  {
    key: 'AgentSetting',
    label: dict('PC.Constants.System.siteAgentSetting'),
  },
  // {
  //   key: 'DomainBind',
  //   label: '域名绑定',
  // },
];
