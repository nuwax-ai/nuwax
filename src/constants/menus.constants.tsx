import homeImage from '@/assets/images/home_image.png';
import homeImageActive from '@/assets/images/home_image_active.png';
import squareImage from '@/assets/images/square_image.png';
import squareImageActive from '@/assets/images/square_image_active.png';
import systemImage from '@/assets/images/system_image.png';
import systemImageActive from '@/assets/images/system_image_active.png';
import teachMaterialImage from '@/assets/images/teach_material.png';
import teachMaterialImageActive from '@/assets/images/teach_material_active.png';
import workflowImage from '@/assets/images/workspace_image.png';
import workflowImageActive from '@/assets/images/workspace_image_active.png';
import { ICON_FILE, ICON_NOTIFICATION } from '@/constants/images.constants';
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
    icon: homeImage,
    iconActive: homeImageActive,
    text: '主页',
    type: TabsEnum.Home,
  },
  {
    icon: workflowImage,
    iconActive: workflowImageActive,
    text: '工作空间',
    type: TabsEnum.Space,
  },
  {
    icon: squareImage,
    iconActive: squareImageActive,
    text: '广场',
    type: TabsEnum.Square,
  },
  {
    icon: teachMaterialImage,
    iconActive: teachMaterialImageActive,
    text: '教材体系',
    type: TabsEnum.Course_System,
  },
  {
    icon: systemImage,
    iconActive: systemImageActive,
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
