import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const HomeSection: React.FC = () => {
  return (
    <div className={cx('px-6', 'py-16')}>
      <h3 className={cx(styles.title)}>最近编辑</h3>
      <ul>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
      </ul>
      <h3 className={cx(styles.title, 'mt-16')}>最近使用</h3>
      <ul>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
      </ul>
      <h3 className={cx(styles.title, 'mt-16')}>收藏</h3>
      <ul>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
      </ul>
    </div>
  );
};

export default HomeSection;
