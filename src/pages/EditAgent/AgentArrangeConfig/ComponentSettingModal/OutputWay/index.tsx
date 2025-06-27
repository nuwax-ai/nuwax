import { OUTPUT_WAY_OPTIONS } from '@/constants/agent.constants';
import { OutputDirectlyEnum } from '@/types/enums/agent';
import { OutputWayProps } from '@/types/interfaces/agentConfig';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 输出方式
const OutputWay: React.FC<OutputWayProps> = ({ directOutput, onSaveSet }) => {
  const [outputDirectlyType, setOutputDirectlyType] =
    useState<OutputDirectlyEnum>();

  useEffect(() => {
    setOutputDirectlyType(directOutput || OutputDirectlyEnum.No);
  }, [directOutput]);

  // 切换调用方式
  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    setOutputDirectlyType(value);
  };

  // 保存
  const handleSave = () => {
    const data = {
      directOutput: outputDirectlyType as OutputDirectlyEnum,
    };
    onSaveSet(data);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1')}>
        <h3>是否直接输出</h3>
        <Radio.Group
          options={OUTPUT_WAY_OPTIONS}
          onChange={handleChangeType}
          value={outputDirectlyType}
        />
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default memo(OutputWay);
