import { SYSTEM_MANAGE_LIST } from '@/constants/system.constants';
import { SystemManageListEnum } from '@/types/enums/systemManage';
import { history, useLocation } from '@@/exports';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const SystemSection: React.FC = () => {
  const location = useLocation();
  const { pathname } = location;

  const handlerApplication = (type: SystemManageListEnum) => {
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
        history.push('/system/global/model/manage');
        break;
      // 系统配置
      case SystemManageListEnum.System_Config:
        history.push('/system/system/config');
        break;
    }
  };

  // 判断是否active
  const handleActive = (type: SystemManageListEnum) => {
    return (
      (type === SystemManageListEnum.Publish_Audit &&
        pathname.includes('audit')) ||
      (type === SystemManageListEnum.User_Manage &&
        pathname.includes('user')) ||
      (type === SystemManageListEnum.Published_Manage &&
        pathname.includes('published')) ||
      (type === SystemManageListEnum.Global_Model_Manage &&
        pathname.includes('global')) ||
      (type === SystemManageListEnum.System_Config &&
        pathname.includes('config'))
    );
  };

  return (
    <div className={cx('px-6', 'py-16')}>
      <h3 className={cx(styles.title)}>系统管理</h3>
      <ul>
        {SYSTEM_MANAGE_LIST.map((item) => (
          <li
            key={item.type}
            onClick={() => handlerApplication(item.type)}
            className={cx(
              styles.row,
              'hover-box',
              'flex',
              'items-center',
              'cursor-pointer',
              { [styles.active]: handleActive(item.type) },
            )}
          >
            {item.icon}
            <span className={cx(styles.text)}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default SystemSection;
