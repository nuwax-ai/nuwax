import { USER_AVATAR_LIST } from '@/constants/menus.constants';
import { apiLogout } from '@/services/account';
import { UserAvatarEnum } from '@/types/enums/menus';
import { Popover } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel, useNavigate, useRequest } from 'umi';
import styles from './index.less';
import UserActionItem from './UserAction';
import UserAvatar from './UserAvatar';

const cx = classNames.bind(styles);

/**
 * 用户头像以及用户操作列表（包含用户名称、设置、退出登录）
 */
const User: React.FC = () => {
  const { openAdmin, setOpenAdmin, setOpenSetting } = useModel('layout');
  let navigate = useNavigate();
  const { run } = useRequest(apiLogout, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      localStorage.clear();
      navigate('/login', { replace: true });
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
      overlayInnerStyle={{
        padding: 0,
      }}
      content={
        <div className={cx(styles.container)}>
          {USER_AVATAR_LIST.map((item) => {
            const style =
              item.type === UserAvatarEnum.Log_Out ? styles['log-out'] : '';
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
      <div>
        <UserAvatar onClick={setOpenAdmin} />
      </div>
    </Popover>
  );
};

export default User;
