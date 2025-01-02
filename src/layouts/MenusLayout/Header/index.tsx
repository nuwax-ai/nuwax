import { ICON_LOGO, ICON_NEW_AGENT } from '@/constants/images.constants';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Header: React.FC = () => {
  const handlerClick = () => {
    // todo
    console.log('header link');
  };
  return (
    <>
      <ICON_LOGO className={cx(styles.logo)} />
      <span
        className={cx(
          styles['add-agent'],
          'flex',
          'content-center',
          'items-center',
          'cursor-pointer',
          'hover-box',
        )}
        onClick={handlerClick}
      >
        <ICON_NEW_AGENT />
      </span>
      <div className={cx(styles['divider-horizontal'])} />
    </>
  );
};

export default Header;
