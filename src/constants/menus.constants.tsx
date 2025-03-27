import {
  ICON_BOOK,
  ICON_FILE,
  ICON_HISTORY,
  ICON_HOME,
  ICON_NOTIFICATION,
  ICON_SETTING,
  ICON_SQUARE,
  ICON_WORKSPACE,
} from '@/constants/images.constants';
import {
  MessageReadStatusEnum,
  SettingActionEnum,
  TabsEnum,
  UserAvatarEnum,
  UserOperatorAreaEnum,
} from '@/types/enums/menus';
import {
  PoweroffOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

// tabs
export const TABS = [
  {
    icon: <ICON_HOME />,
    text: '主页',
    type: TabsEnum.Home,
  },
  {
    icon: <ICON_WORKSPACE />,
    text: '工作空间',
    type: TabsEnum.Space,
  },
  {
    icon: <ICON_SQUARE />,
    text: '广场',
    type: TabsEnum.Square,
  },
  {
    icon: <ICON_BOOK />,
    text: '教材体系',
    type: TabsEnum.Course_System,
  },
  {
    icon: <ICON_SETTING />,
    text: '系统管理',
    type: TabsEnum.System_Manage,
  },
];

// 用户操作区域
export const USER_OPERATE_AREA = [
  {
    title: '文档',
    icon: <ICON_FILE />,
    type: UserOperatorAreaEnum.Document,
  },
  {
    title: '历史会话',
    icon: <ICON_HISTORY />,
    type: UserOperatorAreaEnum.History_Conversation,
  },
  {
    title: '消息',
    icon: <ICON_NOTIFICATION />,
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
];
