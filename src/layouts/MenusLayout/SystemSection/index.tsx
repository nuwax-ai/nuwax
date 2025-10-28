import SecondMenuItem from '@/components/base/SecondMenuItem';
import { SYSTEM_MANAGE_LIST } from '@/constants/system.constants';
import { SystemManageListEnum } from '@/types/enums/systemManage';
import React from 'react';
import { history, useLocation, useModel } from 'umi';

/**
 * 主页二级菜单栏
 */
const SystemSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const location = useLocation();
  const { pathname } = location;
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  const handlerApplication = (type: SystemManageListEnum | string) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();

    switch (type) {
      // 用户管理
      case SystemManageListEnum.User_Manage:
        history.push('/system/user/manage');
        break;
      // 发布审核
      case SystemManageListEnum.Publish_Audit:
        history.push('/system/publish/audit');
        break;
      // 已发布管理
      case SystemManageListEnum.Published_Manage:
        history.push('/system/published/manage');
        break;
      // 全局模型管理
      case SystemManageListEnum.Global_Model_Manage:
        history.push('/system/model/manage');
        break;
      // 系统配置
      case SystemManageListEnum.System_Config:
        history.push('/system/config');
        break;
      // 主题配置
      case SystemManageListEnum.Theme_Config:
        history.push('/system/theme/config');
        break;
      // Markdown 测试
      case 'markdown-test':
        history.push('/markdown-test');
        break;
    }
  };

  // 判断是否active
  const handleActive = (type: SystemManageListEnum | string) => {
    return (
      (type === SystemManageListEnum.Publish_Audit &&
        pathname.includes('audit')) ||
      (type === SystemManageListEnum.User_Manage &&
        pathname.includes('user')) ||
      (type === SystemManageListEnum.Published_Manage &&
        pathname.includes('published')) ||
      (type === SystemManageListEnum.Global_Model_Manage &&
        pathname.includes('model')) ||
      (type === SystemManageListEnum.System_Config &&
        pathname.includes('config') &&
        !pathname.includes('theme')) ||
      (type === SystemManageListEnum.Theme_Config &&
        pathname.includes('theme/config')) ||
      (type === 'markdown-test' && pathname.includes('markdown-test'))
    );
  };

  return (
    <div style={style}>
      <div>
        {SYSTEM_MANAGE_LIST.map((item, index) => (
          <SecondMenuItem
            key={item.type}
            onClick={() => handlerApplication(item.type)}
            name={item.text}
            isActive={handleActive(item.type)}
            isFirst={index === 0}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
};
export default SystemSection;
