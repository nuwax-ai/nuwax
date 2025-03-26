import { PLUGIN_SETTING_ACTIONS } from '@/constants/space.constants';
import { PluginSettingEnum } from '@/types/enums/space';
import type { PluginModelSettingProps } from '@/types/interfaces/agentConfig';
import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import CardBind from './CardBind';
import styles from './index.less';
import ParamsSetting from './ParamsSetting';

const cx = classNames.bind(styles);

/**
 * 插件模型设置
 */
const PluginModelSetting: React.FC<PluginModelSettingProps> = ({
  open,
  componentInfo,
  variables,
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
        return (
          <ParamsSetting
            id={componentInfo.id}
            inputConfigArgs={componentInfo?.bindConfig?.inputArgBindConfigs}
            variables={variables}
          />
        );
      case PluginSettingEnum.Card_Bind:
        return <CardBind />;
    }
  };

  return (
    <Modal
      centered
      open={open}
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
