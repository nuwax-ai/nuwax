import { USER_AVATAR_LIST } from '@/constants/menus.constants';
import { apiLogout } from '@/services/account';
import { UserAvatarEnum } from '@/types/enums/menus';
import { redirectToLogin } from '@/utils/router';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import { useModel, useNavigate, useRequest } from 'umi';
import styles from './index.less';
import UserActionItem from './UserAction';
import UserAvatar from './UserAvatar';

const cx = classNames.bind(styles);

interface UserProps {
  isAppDetails?: boolean;
}

/**
 * 用户头像以及用户操作列表（包含用户名称、设置、退出登录）
 */
const User: React.FC<PropsWithChildren<UserProps>> = ({
  children,
  isAppDetails = false,
}) => {
  const { openAdmin, setOpenAdmin, setOpenSetting } = useModel('layout');
  const { userInfo } = useModel('userInfo');
  // 清除菜单信息
  const { clearMenuInfo } = useModel('menuModel');

  const { clearSpaceInfo } = useModel('spaceModel');

  let navigate = useNavigate();
  const { run } = useRequest(apiLogout, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      localStorage.clear();
      // 清除菜单信息
      clearMenuInfo();

      // 清除空间信息
      clearSpaceInfo();

      // 如果是在应用详情页，则跳转到登录页
      if (isAppDetails) {
        const currentPath = location.pathname;
        redirectToLogin(currentPath);
      } else {
        navigate('/login', { replace: true });
      }
    },
  });

  const handlerClick = (type: UserAvatarEnum) => {
    switch (type) {
      // 用户名称
      case UserAvatarEnum.User_Name:
        break;
      case UserAvatarEnum.Setting:
        setOpenAdmin(false);
        setOpenSetting(true);
        break;
      case UserAvatarEnum.Log_Out:
        setOpenAdmin(false);
        run();
        break;
    }
  };
  return (
    <Popover
      placement="rightBottom"
      title={null}
      styles={{
        body: {
          padding: 0,
        },
      }}
      content={
        <div className={cx(styles.container)}>
          {USER_AVATAR_LIST.map((item) => {
            const style =
              item.type === UserAvatarEnum.Log_Out ? styles['log-out'] : '';
            // 显示用户名称或默认值
            item.text =
              item.type === UserAvatarEnum.User_Name
                ? userInfo?.nickName || userInfo?.userName
                : item.text;
            return (
              <UserActionItem
                key={item.type}
                {...item}
                onClick={handlerClick}
                className={style}
              />
            );
          })}
          <div className={styles['divider-horizontal']} />
        </div>
      }
      arrow={false}
      trigger="click"
      open={openAdmin}
      onOpenChange={setOpenAdmin}
    >
      {/*这里需要包裹一层div，否则控制台会出现Warning警告，可能跟Popover组件有关*/}
      {children || (
        <div className={styles['user-avatar-container']}>
          <UserAvatar
            avatar={userInfo?.avatar}
            onClick={() => setOpenAdmin(true)}
          />
        </div>
      )}
    </Popover>
  );
};

export default User;
