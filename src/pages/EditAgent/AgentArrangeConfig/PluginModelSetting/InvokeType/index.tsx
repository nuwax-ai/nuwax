import { CALL_METHOD_OPTIONS } from '@/constants/agent.constants';
import { InvokeTypeEnum } from '@/types/enums/agent';
import type { InvokeTypeProps } from '@/types/interfaces/agentConfig';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 调用方式
const InvokeType: React.FC<InvokeTypeProps> = ({ invokeType, onSave }) => {
  const [type, setType] = useState<InvokeTypeEnum>();

  useEffect(() => {
    setType(invokeType || InvokeTypeEnum.AUTO);
  }, [invokeType]);

  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    setType(value);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <h3>调用方式</h3>
      <Radio.Group
        className={cx('flex-1')}
        options={CALL_METHOD_OPTIONS}
        onChange={handleChangeType}
        value={type}
      />
      <footer className={cx(styles.footer)}>
        <Button
          type="primary"
          onClick={() => onSave('invokeType', type as InvokeTypeEnum)}
        >
          保存
        </Button>
      </footer>
    </div>
  );
};

export default memo(InvokeType);
