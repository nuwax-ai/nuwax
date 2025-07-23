import { OUTPUT_WAY_OPTIONS } from '@/constants/agent.constants';
import { OutputDirectlyEnum } from '@/types/enums/agent';
import { OutputWayProps } from '@/types/interfaces/agentConfig';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Radio, RadioChangeEvent, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 输出方式
const OutputWay: React.FC<OutputWayProps> = ({ directOutput, onSaveSet }) => {
  const [outputDirectlyType, setOutputDirectlyType] =
    useState<OutputDirectlyEnum>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setOutputDirectlyType(directOutput || OutputDirectlyEnum.No);
  }, [directOutput]);

  // 切换调用方式
  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    setOutputDirectlyType(value);
  };

  // 保存
  const handleSave = async () => {
    const data = {
      directOutput: outputDirectlyType as OutputDirectlyEnum,
    };
    setLoading(true);
    await onSaveSet(data);
    setLoading(false);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1')}>
        <h3 className={cx('gap-6', 'flex', 'items-center')}>
          <span>是否直接输出</span>
          <Tooltip
            title={
              '如果选择“是”，将会把工作流运行结果直接输出到会话框中，不会再经过大模型总结输出。'
            }
          >
            <ExclamationCircleOutlined className={cx(styles.icon)} />
          </Tooltip>
        </h3>
        <Radio.Group
          options={OUTPUT_WAY_OPTIONS}
          onChange={handleChangeType}
          value={outputDirectlyType}
        />
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default memo(OutputWay);
