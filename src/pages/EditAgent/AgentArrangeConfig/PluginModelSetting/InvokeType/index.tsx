import ConditionRender from '@/components/ConditionRender';
import {
  CALL_DEFAULT_SELECTED,
  CALL_METHOD_OPTIONS,
} from '@/constants/agent.constants';
import { DefaultSelectedEnum, InvokeTypeEnum } from '@/types/enums/agent';
import type {
  InvokeTypeProps,
  InvokeTypeSaveParams,
} from '@/types/interfaces/agentConfig';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 调用方式
const InvokeType: React.FC<InvokeTypeProps> = ({
  invokeType,
  onSaveSet,
  defaultSelected,
}) => {
  const [type, setType] = useState<InvokeTypeEnum>(InvokeTypeEnum.AUTO);
  // 是否默认选中
  const [selected, setSelected] = useState<DefaultSelectedEnum>(
    DefaultSelectedEnum.No,
  );

  useEffect(() => {
    setType(invokeType || InvokeTypeEnum.AUTO);
    setSelected(defaultSelected || DefaultSelectedEnum.No);
  }, [invokeType, defaultSelected]);

  // 切换调用方式
  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    setType(value);
    if (value === InvokeTypeEnum.AUTO || value === InvokeTypeEnum.ON_DEMAND) {
      setSelected(DefaultSelectedEnum.No);
    }
  };

  // 保存
  const handleSave = () => {
    const data: InvokeTypeSaveParams = {
      invokeType: type,
      defaultSelected: selected,
    };
    onSaveSet(data);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1')}>
        <h3>调用方式</h3>
        <Radio.Group
          options={CALL_METHOD_OPTIONS}
          onChange={handleChangeType}
          value={type}
        />
        {/* 手动选择和手动选择+按需调用时才显示 */}
        <ConditionRender
          condition={
            type === InvokeTypeEnum.MANUAL ||
            type === InvokeTypeEnum.MANUAL_ON_DEMAND
          }
        >
          <h3 className={cx('mt-16')}>是否默认选中</h3>
          <Radio.Group
            options={CALL_DEFAULT_SELECTED}
            onChange={(e) => setSelected(e.target.value as DefaultSelectedEnum)}
            value={selected}
          />
        </ConditionRender>
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default memo(InvokeType);
