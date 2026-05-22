import { USER_AVATAR_LIST } from '@/constants/menus.constants';
import { apiLogout } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { UserAvatarEnum } from '@/types/enums/menus';
import { redirectToLogin } from '@/utils/router';
import {
  CreditCardOutlined,
  FileTextOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { Popover } from 'antd';
import { TooltipPlacement } from 'antd/es/tooltip';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import { useModel, useNavigate, useRequest } from 'umi';
import styles from './index.less';
import UserActionItem from './UserAction';
import UserAvatar from './UserAvatar';

const cx = classNames.bind(styles);

interface UserProps {
  isAppDetails?: boolean;
  placement?: TooltipPlacement;
}

/**
 * 用户头像以及用户操作列表（包含用户名称、设置、退出登录）
 */
const User: React.FC<PropsWithChildren<UserProps>> = ({
  children,
  placement = 'rightBottom',
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

  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  const showSubMenus = isAppDetails && isEnableSubscription;

  const menuList = React.useMemo(() => {
    if (!showSubMenus) return USER_AVATAR_LIST;
    const list = [...USER_AVATAR_LIST];
    const subMenus = [
      {
        type: UserAvatarEnum.My_Subscriptions,
        icon: <CreditCardOutlined style={{ fontSize: 14 }} />,
        text: dict('PC.Pages.MorePage.MySubscriptions.pageTitle'),
      },
      {
        type: UserAvatarEnum.My_Orders,
        icon: <FileTextOutlined style={{ fontSize: 14 }} />,
        text: dict('PC.Pages.MorePage.MyOrders.pageTitle'),
      },
      {
        type: UserAvatarEnum.Usage_Stats,
        icon: <LineChartOutlined style={{ fontSize: 14 }} />,
        text: dict('PC.Pages.UsageStats.pageTitle'),
      },
    ];
    // 在倒数第一项（退出登录）前插入这三项
    list.splice(list.length - 1, 0, ...subMenus);
    return list;
  }, [showSubMenus]);

  const handlerClick = (type: UserAvatarEnum) => {
    switch (type) {
      // 用户名称
      case UserAvatarEnum.User_Name:
        break;
      case UserAvatarEnum.Setting:
        setOpenAdmin(false);
        setOpenSetting(true);
        break;
      case UserAvatarEnum.My_Subscriptions:
        setOpenAdmin(false);
        navigate(`/app/my-subscriptions`);
        break;
      case UserAvatarEnum.My_Orders:
        setOpenAdmin(false);
        navigate(`/app/my-orders`);
        break;
      case UserAvatarEnum.Usage_Stats:
        setOpenAdmin(false);
        navigate(`/app/usage-stats`);
        break;
      case UserAvatarEnum.Log_Out:
        setOpenAdmin(false);
        run();
        break;
    }
  };

  const getMenuText = (item: any): string => {
    switch (item.type) {
      case UserAvatarEnum.User_Name:
        return (
          userInfo?.nickName ||
          userInfo?.userName ||
          dict('PC.Components.UserMenu.defaultUserName')
        );
      case UserAvatarEnum.Setting:
        return dict('PC.Components.UserMenu.profile');
      case UserAvatarEnum.Log_Out:
        return dict('PC.Components.UserMenu.logout');
      case UserAvatarEnum.My_Subscriptions:
        return dict('PC.Pages.MorePage.MySubscriptions.pageTitle');
      case UserAvatarEnum.My_Orders:
        return dict('PC.Pages.MorePage.MyOrders.pageTitle');
      case UserAvatarEnum.Usage_Stats:
        return dict('PC.Pages.UsageStats.pageTitle');
      default:
        return item.text || '';
    }
  };
  return (
    <Popover
      placement={placement}
      title={null}
      styles={{
        body: {
          padding: 0,
        },
      }}
      content={
        <div className={cx(styles.container)}>
          {menuList.map((item) => {
            const style =
              item.type === UserAvatarEnum.Log_Out ? styles['log-out'] : '';
            const cursorStyle =
              item.type === UserAvatarEnum.User_Name
                ? styles['cursor-default']
                : '';
            return (
              <UserActionItem
                key={item.type}
                {...item}
                text={getMenuText(item)}
                onClick={handlerClick}
                className={cx(cursorStyle, style)}
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
