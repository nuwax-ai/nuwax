import {
  ICON_HOME,
  ICON_SQUARE,
  ICON_WORKSPACE,
} from '@/constants/images.constants';
import {
  MessageOptionEnum,
  SettingActionEnum,
  TabsEnum,
  UserAvatarEnum,
  UserOperatorAreaEnum,
} from '@/types/enums/menus';
import {
  BellOutlined,
  CommentOutlined,
  CopyOutlined,
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
];

// 用户操作区域
export const USER_OPERATE_AREA = [
  {
    title: '文档',
    icon: <CopyOutlined />,
    type: UserOperatorAreaEnum.Document,
  },
  {
    title: '历史会话',
    icon: <CommentOutlined />,
    type: UserOperatorAreaEnum.History_Conversation,
  },
  {
    title: '消息',
    icon: <BellOutlined />,
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

export const MESSAGE_OPTIONS = [
  {
    label: '全部',
    value: MessageOptionEnum.All,
  },
  {
    label: '未读',
    value: MessageOptionEnum.Unread,
  },
];

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
