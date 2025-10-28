import { BindConfigWithSub } from '@/types/interfaces/common';
import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import ParamsSetting from '../../../../components/ParamsSetting';
import styles from './SettingModal.less';

const cx = classNames.bind(styles);

// 插件模型设置
interface SettingModalProps {
  open: boolean;
  variables: any[];
  inputArgBindConfigs: BindConfigWithSub[];
  onSave: (params: { [key: string]: BindConfigWithSub[] }) => void;
  onCancel: () => void;
}

/**
 * 插件模型设置
 */
const SettingModal: React.FC<SettingModalProps> = ({
  open,
  inputArgBindConfigs,
  variables,
  onCancel,
  onSave,
}) => {
  // 保存设置
  const handleOnSave = (value: any) => {
    onSave(value);
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div
          className={cx(styles.container, 'overflow-hide', 'flex', 'flex-col')}
        >
          <div className={cx('flex-1', styles.right)}>
            <ParamsSetting
              style={{
                paddingTop: '48px',
              }}
              variables={variables}
              inputArgBindConfigs={inputArgBindConfigs}
              onSaveSet={handleOnSave}
            />
          </div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={onCancel}
          />
        </div>
      )}
    />
  );
};

export default SettingModal;
