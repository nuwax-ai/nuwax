import { VISIBLE_TO_LLM_OPTIONS } from '@/constants/agent.constants';
import { VisibleToLLMProps } from '@/types/interfaces/agentConfig';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 模型可见
const VisibleToLLM: React.FC<VisibleToLLMProps> = ({
  visibleToLLMType,
  onChangePageInfo,
  onSaveSet,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  // 切换调用方式
  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    onChangePageInfo('visibleToLLM', value);
  };

  // 保存
  const handleSave = async () => {
    setLoading(true);
    await onSaveSet();
    setLoading(false);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1')}>
        <h3 className={cx('mb-12')}>是否模型可见</h3>
        <Radio.Group
          options={VISIBLE_TO_LLM_OPTIONS}
          onChange={handleChangeType}
          value={visibleToLLMType}
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

export default VisibleToLLM;
