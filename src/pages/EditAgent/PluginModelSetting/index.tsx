import { PLUGIN_SETTING_ACTIONS } from '@/constants/space.contants';
import { PluginSettingEnum } from '@/types/enums/space';
import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import CardBind from './CardBind';
import styles from './index.less';
import ParamsSetting from './ParamsSetting';

const cx = classNames.bind(styles);

interface PluginModelSettingProps {
  open: boolean;
  onCancel: () => void;
}

const PluginModelSetting: React.FC<PluginModelSettingProps> = ({
  open,
  onCancel,
}) => {
  const [action, setAction] = useState<PluginSettingEnum>(
    PluginSettingEnum.Params,
  );

  const handlerClick = (type: PluginSettingEnum) => {
    setAction(type);
  };

  const Content: React.FC = () => {
    switch (action) {
      case PluginSettingEnum.Params:
        return <ParamsSetting />;
      case PluginSettingEnum.Card_Bind:
        return <CardBind />;
    }
  };

  return (
    <Modal
      centered
      open={open}
      footer={null}
      onCancel={onCancel}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>设置</h3>
            <ul>
              {PLUGIN_SETTING_ACTIONS.map((item) => (
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
          <div className={cx('flex-1', styles.right)}>
            <Content />
          </div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={onCancel}
          />
        </div>
      )}
    ></Modal>
  );
};

export default PluginModelSetting;
