import { SETTING_ACTIONS } from '@/constants/menus.constants';
import { SettingActionEnum } from '@/types/enums/menus';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Setting: React.FC = () => {
  const { openSetting, setOpenSetting } = useModel('layout');
  const [action, setAction] = useState<SettingActionEnum>(
    SettingActionEnum.Account,
  );

  const handlerClick = (type: SettingActionEnum) => {
    setAction(type);
  };
  return (
    <Modal
      centered
      open={openSetting}
      footer={null}
      onCancel={() => setOpenSetting(false)}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>设置</h3>
            <ul>
              {SETTING_ACTIONS.map((item) => (
                <li
                  key={item.type}
                  className={cx(styles.item, 'cursor-pointer', {
                    [styles.checked]: action === item.type,
                  })}
                  onClick={() => handlerClick(item.type)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className={cx('flex-1')}></div>
        </div>
      )}
    ></Modal>
  );
};

export default Setting;
