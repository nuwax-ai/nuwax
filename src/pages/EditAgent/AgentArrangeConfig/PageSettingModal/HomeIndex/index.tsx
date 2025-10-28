import { HOME_INDEX_OPTIONS } from '@/constants/agent.constants';
import { HomeIndexProps } from '@/types/interfaces/agentConfig';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 是否为智能体默认首页
const HomeIndex: React.FC<HomeIndexProps> = ({
  homeIndexType,
  onChangePageInfo,
  onSaveSet,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  // 切换调用方式
  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    onChangePageInfo('homeIndex', value);
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
        <h3 className={cx('mb-12')}>是否为默认首页</h3>
        <Radio.Group
          options={HOME_INDEX_OPTIONS}
          onChange={handleChangeType}
          value={homeIndexType}
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

export default HomeIndex;
