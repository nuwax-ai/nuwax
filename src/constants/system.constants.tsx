import {
  ICON_APPLICATION_DEV,
  ICON_COMPONENT_LIBRARY,
  ICON_GROUP_SET,
} from '@/constants/images.constants';
import { SystemManageListEnum } from '@/types/enums/systemManage';

// 系统管理应用列表（layout二级菜单）
export const SYSTEM_MANAGE_LIST = [
  {
    type: SystemManageListEnum.User_Manage,
    icon: <ICON_APPLICATION_DEV />,
    text: '用户管理',
  },
  {
    type: SystemManageListEnum.Publish_Audit,
    icon: <ICON_COMPONENT_LIBRARY />,
    text: '发布审核',
  },
  {
    type: SystemManageListEnum.Published_Manage,
    icon: <ICON_GROUP_SET />,
    text: '已发布管理',
  },
  {
    type: SystemManageListEnum.Global_Model_Manage,
    icon: <ICON_GROUP_SET />,
    text: '全局模型管理',
  },
  {
    type: SystemManageListEnum.System_Config,
    icon: <ICON_GROUP_SET />,
    text: '系统配置',
  },
];
