import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import {
  CommentOutlined,
  CopyOutlined,
  GlobalOutlined,
  HomeOutlined,
  InboxOutlined,
  MessageOutlined,
} from '@ant-design/icons';

// tabs
export const TABS = [
  {
    icon: <HomeOutlined />,
    text: '主页',
    type: TabsEnum.Home,
  },
  {
    icon: <InboxOutlined />,
    text: '工作空间',
    type: TabsEnum.Space,
  },
  {
    icon: <GlobalOutlined />,
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
    icon: <MessageOutlined />,
    type: UserOperatorAreaEnum.Message,
  },
];
