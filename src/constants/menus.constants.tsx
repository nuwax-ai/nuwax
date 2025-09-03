// import teachMaterialImage from '@/assets/images/teach_material.png';
// import teachMaterialImageActive from '@/assets/images/teach_material_active.png';
import SvgIcon from '@/components/base/SvgIcon';
import {
  MessageReadStatusEnum,
  SettingActionEnum,
  TabsEnum,
  UserAvatarEnum,
  UserOperatorAreaEnum,
} from '@/types/enums/menus';
import { UserOperateAreaItemType } from '@/types/interfaces/layouts';
import {
  PoweroffOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

// tabs
export const TABS = [
  {
    icon: <SvgIcon name="icons-nav-new_chat" />,
    text: '新建会话',
    type: TabsEnum.NewChat,
  },
  {
    icon: <SvgIcon name="icons-nav-home" />,
    text: '主页',
    type: TabsEnum.Home,
  },
  {
    icon: <SvgIcon name="icons-nav-workspace" />,
    text: '工作空间',
    type: TabsEnum.Space,
  },
  {
    icon: <SvgIcon name="icons-nav-square" />,
    text: '广场',
    type: TabsEnum.Square,
  },
  {
    icon: <SvgIcon name="icons-nav-ecosystem" />,
    text: '生态市场',
    type: TabsEnum.Ecosystem_Market,
  },
  {
    icon: <SvgIcon name="icons-nav-settings" />,
    text: '系统管理',
    type: TabsEnum.System_Manage,
  },
  // {
  //   icon: teachMaterialImage,
  //   text: '教材体系',
  //   type: TabsEnum.Course_System,
  // },
];

// 用户操作区域
export const USER_OPERATE_AREA: UserOperateAreaItemType[] = [
  {
    title: '文档',
    icon: <SvgIcon name="icons-nav-doc" />,
    type: UserOperatorAreaEnum.Document,
  },
  {
    title: '暂无未读消息',
    icon: <SvgIcon name="icons-nav-notification" />,
    type: UserOperatorAreaEnum.Message,
  },
];

// 用户头像操作列表
export const USER_AVATAR_LIST = [
  {
    type: UserAvatarEnum.User_Name,
    icon: <UserOutlined />,
    text: '用户名称',
  },
  {
    type: UserAvatarEnum.Setting,
    icon: <SettingOutlined />,
    text: '设置',
  },
  {
    type: UserAvatarEnum.Log_Out,
    icon: <PoweroffOutlined />,
    text: '退出登录',
  },
];

// 消息分段器选项
export const MESSAGE_OPTIONS = [
  {
    label: '全部',
    value: MessageReadStatusEnum.All,
  },
  {
    label: '未读',
    value: MessageReadStatusEnum.Unread,
  },
];

// 设置选项
export const SETTING_ACTIONS = [
  {
    type: SettingActionEnum.Account,
    label: '账号',
  },
  {
    type: SettingActionEnum.Email_Bind,
    label: '邮箱绑定',
  },
  {
    type: SettingActionEnum.Reset_Password,
    label: '重置密码',
  },
  {
    type: SettingActionEnum.Theme_Switch,
    label: '主题切换',
  },
];
