import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import {
  MessageReadStatusEnum,
  SettingActionEnum,
  TabsEnum,
  UserAvatarEnum,
  UserOperatorAreaEnum,
} from '@/types/enums/menus';
import { UserOperateAreaItemType } from '@/types/interfaces/layouts';
import { PoweroffOutlined, UserOutlined } from '@ant-design/icons';

// tabs
export const TABS = [
  {
    icon: <SvgIcon name="icons-nav-new_chat" />,
    text: dict('PC.Constants.Menus.newChat'),
    type: TabsEnum.NewChat,
  },
  {
    icon: <SvgIcon name="icons-nav-home" />,
    text: dict('PC.Constants.Menus.home'),
    type: TabsEnum.Home,
  },
  {
    icon: <SvgIcon name="icons-nav-workspace" />,
    text: dict('PC.Constants.Menus.workspace'),
    type: TabsEnum.Space,
  },
  {
    icon: <SvgIcon name="icons-nav-square" />,
    text: dict('PC.Constants.Menus.square'),
    type: TabsEnum.Square,
  },
  {
    icon: <SvgIcon name="icons-nav-ecosystem" />,
    text: dict('PC.Constants.Menus.ecosystemMarket'),
    type: TabsEnum.Ecosystem_Market,
  },
  {
    icon: <SvgIcon name="icons-nav-settings" />,
    text: dict('PC.Constants.Menus.systemManage'),
    type: TabsEnum.System_Manage,
  },
];

// 用户操作区域
export const USER_OPERATE_AREA: UserOperateAreaItemType[] = [
  {
    title: dict('PC.Constants.Menus.document'),
    icon: <SvgIcon name="icons-nav-doc" />,
    type: UserOperatorAreaEnum.Document,
  },
  {
    title: dict('PC.Constants.Menus.noUnread'),
    icon: <SvgIcon name="icons-nav-notification" />,
    type: UserOperatorAreaEnum.Message,
  },
  {
    title: dict('PC.Constants.Menus.myComputer'),
    icon: <SvgIcon name="icons-nav-computer" />,
    type: UserOperatorAreaEnum.Computer,
  },
];

// 用户头像操作列表
export const USER_AVATAR_LIST = [
  {
    type: UserAvatarEnum.User_Name,
    icon: <UserOutlined />,
    text: dict('PC.Constants.Menus.userName'),
  },
  {
    type: UserAvatarEnum.Setting,
    icon: <SvgIcon name="icons-common-user_info" style={{ fontSize: 14 }} />,
    text: dict('PC.Constants.Menus.profile'),
  },
  {
    type: UserAvatarEnum.Log_Out,
    icon: <PoweroffOutlined />,
    text: dict('PC.Constants.Menus.logout'),
  },
];

// 消息分段器选项
export const MESSAGE_OPTIONS = [
  {
    label: dict('PC.Common.Global.all'),
    value: MessageReadStatusEnum.All,
  },
  {
    label: dict('PC.Constants.Menus.unread'),
    value: MessageReadStatusEnum.Unread,
  },
];

// 设置选项
export const SETTING_ACTIONS = [
  {
    type: SettingActionEnum.Account,
    label: dict('PC.Constants.Menus.account'),
  },
  {
    type: SettingActionEnum.Email_Bind,
    label: dict('PC.Constants.Menus.emailBind'),
  },
  {
    type: SettingActionEnum.Reset_Password,
    label: dict('PC.Constants.Menus.resetPassword'),
  },
  {
    type: SettingActionEnum.Theme_Switch,
    label: dict('PC.Constants.Menus.themeSwitch'),
  },
  {
    type: SettingActionEnum.Language_Switch,
    label: dict('PC.Constants.Menus.languageSwitch'),
  },
  {
    type: SettingActionEnum.Usage_Statistics,
    label: dict('PC.Constants.Menus.usageStatistics'),
  },
];

// 其它需要单独分离的一级菜单 code 类别常量
export const MENU_CODE_DOCUMENTS = 'documents';
export const MENU_CODE_NOTIFICATION = 'notification';
export const MENU_CODE_MY_COMPUTER = 'my_computer';
export const MENU_CODE_MORE_PAGE = 'more_page';

// 其它需要单独分离的一级菜单 code 列表
export const OTHER_MENU_CODES = [
  MENU_CODE_DOCUMENTS,
  MENU_CODE_NOTIFICATION,
  MENU_CODE_MY_COMPUTER,
  MENU_CODE_MORE_PAGE,
];
