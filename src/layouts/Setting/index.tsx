import { SETTING_ACTIONS } from '@/constants/menus.constants';
import { SettingActionEnum } from '@/types/enums/menus';
import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import ResetPassword from './ResetPassword';
import SettingAccount from './SettingAccount';
import SettingEmail from './SettingEmail';

const cx = classNames.bind(styles);

const Setting: React.FC = () => {
  const { openSetting, setOpenSetting } = useModel('layout');
  const [action, setAction] = useState<SettingActionEnum>(
    SettingActionEnum.Account,
  );

  const handlerClick = (type: SettingActionEnum) => {
    setAction(type);
  };

  const Content: React.FC = () => {
    switch (action) {
      case SettingActionEnum.Account:
        return <SettingAccount />;
      case SettingActionEnum.Email_Bind:
        return <SettingEmail />;
      case SettingActionEnum.Reset_Password:
        return <ResetPassword />;
    }
  };

  // 获取当前登录方式,如果有@证明是邮箱登录,否则是手机登录
  const phone = localStorage.getItem('PHONE')?.includes('@');
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
                  {item.label === '邮箱绑定'
                    ? phone
                      ? '手机绑定'
                      : '邮箱绑定'
                    : item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>
            <Content />
          </div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={() => setOpenSetting(false)}
          />
        </div>
      )}
    ></Modal>
  );
};

export default Setting;
