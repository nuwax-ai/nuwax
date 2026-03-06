import SvgIcon from '@/components/base/SvgIcon';
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
    text: '用户管理',
  },
  {
    type: SystemManageListEnum.Publish_Audit,
    icon: <SvgIcon name="icons-nav-publish_audit" />,
    text: '发布审核',
  },
  {
    type: SystemManageListEnum.Published_Manage,
    icon: <SvgIcon name="icons-nav-publish_manage" />,
    text: '已发布管理',
  },
  {
    type: SystemManageListEnum.Global_Model_Manage,
    icon: <SvgIcon name="icons-nav-model" />,
    text: '公共模型管理',
  },
  {
    type: SystemManageListEnum.System_Config,
    icon: <SvgIcon name="icons-nav-settings" />,
    text: '系统配置',
    list: [
      {
        text: '系统设置',
        type: SystemManageListEnum.System_Setting,
      },
      {
        text: '主题配置',
        type: SystemManageListEnum.Theme_Config,
      },
      {
        text: '沙盒配置',
        type: SystemManageListEnum.Sandbox_Config,
      },
      {
        text: '分类管理',
        type: SystemManageListEnum.Category_Manage,
      },
    ],
  },
  {
    type: SystemManageListEnum.Dashboard,
    icon: <SvgIcon name="icons-nav-dashboard" />,
    text: '系统概览',
  },
  {
    type: SystemManageListEnum.Task_Manage,
    icon: <SvgIcon name="icons-nav-task-time" />,
    text: '任务管理',
  },
  {
    type: SystemManageListEnum.MenuPermission,
    icon: <SvgIcon name="icons-nav-permission" />,
    text: '菜单权限',
    list: [
      {
        text: '权限资源',
        type: SystemManageListEnum.Permission_Resources,
      },
      {
        text: '菜单管理',
        type: SystemManageListEnum.Menu_Manage,
      },
      {
        text: '角色管理',
        type: SystemManageListEnum.Role_Manage,
      },
      {
        text: '用户组管理',
        type: SystemManageListEnum.User_Group_Manage,
      },
    ],
  },
  {
    type: SystemManageListEnum.Log_Query,
    icon: <SvgIcon name="icons-nav-log" />,
    text: '日志查询',
    list: [
      // {
      //   text: '操作日志',
      //   type: SystemManageListEnum.Operation_Log,
      //   // icon: <SvgIcon name="icons-nav-log-operation" />,
      // },
      {
        text: '运行日志',
        type: SystemManageListEnum.Running_Log,
        // icon: <SvgIcon name="icons-nav-log-running" />,
      },
    ],
  },
  {
    type: SystemManageListEnum.Content,
    icon: <SvgIcon name="icons-nav-cube" />,
    text: '内容管理',
    list: [
      {
        text: '空间',
        type: SystemManageListEnum.Content_Space,
      },
      {
        text: '智能体',
        type: SystemManageListEnum.Content_Agent,
      },
      {
        text: '网页应用',
        type: SystemManageListEnum.Content_WebApplication,
      },
      {
        text: '知识库',
        type: SystemManageListEnum.Content_KnowledgeBase,
      },
      {
        text: '数据表',
        type: SystemManageListEnum.Content_DataTable,
      },
      {
        text: '工作流',
        type: SystemManageListEnum.Content_Workflow,
      },
      {
        text: '插件',
        type: SystemManageListEnum.Content_Plugin,
      },
      {
        text: 'MCP',
        type: SystemManageListEnum.Content_Mcp,
      },
      {
        text: '技能',
        type: SystemManageListEnum.Content_Skill,
      },
    ],
  },
];

// 消息类型, Broadcast时可以不传userIds,可用值:Broadcast,Private,System
export const MESSAGE_SCOPE_OPTIONS = [
  {
    label: '指定用户发送',
    value: MessageScopeEnum.Broadcast,
  },
  {
    label: '系统消息（全部用户）',
    value: MessageScopeEnum.System,
  },
];

// 系统配置页面tab
export const SYSTEM_SETTING_TABS: TabsProps['items'] = [
  {
    key: 'BaseConfig',
    label: '基础配置',
  },
  {
    key: 'ModelSetting',
    label: '默认模型设置',
  },
  {
    key: 'AgentSetting',
    label: '站点智能体设置',
  },
  // {
  //   key: 'DomainBind',
  //   label: '域名绑定',
  // },
];
