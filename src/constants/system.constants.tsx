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
    icon: <SvgIcon name="icons-nav-template" />,
    text: '已发布管理',
  },
  {
    type: SystemManageListEnum.Global_Model_Manage,
    icon: <SvgIcon name="icons-nav-template" />,
    text: '公共模型管理',
  },
  {
    type: SystemManageListEnum.System_Config,
    icon: <SvgIcon name="icons-nav-settings" />,
    text: '系统配置',
  },
  {
    type: SystemManageListEnum.Theme_Config,
    icon: <SvgIcon name="icons-nav-palette" />,
    text: '主题配置',
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
