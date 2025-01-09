import SelectList from '@/components/SelectList';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Space: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<number>(0);
  const handleChange = (value: string) => {
    setSelectedItem(value);
  };

  return (
    <div className={cx(styles.container, 'h-full')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>应用开发</h3>
        <Button type="primary" icon={<PlusOutlined />}>
          Search
        </Button>
      </div>
      <div className={cx('flex')}>
        <SelectList
          value={selectedItem}
          options={[
            { value: 0, label: '全部' },
            { value: 1, label: '已发布' },
            { value: 2, label: '法师法师' },
          ]}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default Space;
