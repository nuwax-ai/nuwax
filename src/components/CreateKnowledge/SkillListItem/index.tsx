import { DeleteOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React from 'react';
import './index.less';
import styles from './index.less';

const cx = classNames.bind(styles);

const SkillListItem: React.FC<{
  item: {
    icon: string;
    name: string;
    description: string;
  };
  onDelete?: () => void;
}> = ({ item, onDelete }) => (
  <div className={cx(styles['skill-item-style'], 'dis-left')}>
    <img src={item.icon} alt="" className={cx(styles['skill-item-icon'])} />
    <div className={cx(styles['skill-item-content-style'])}>
      <div className={cx(styles['skill-item-title-style'])}>{item.name}</div>
      <div className={cx(styles['skill-item-desc-style'])}>
        {item.description}
      </div>
    </div>
    <div className={cx(styles['mask-layer-style'])}>
      <div style={{ color: '#fff', backgroundColor: 'transparent' }}>
        <Popover content={'移除'} trigger="hover">
          <DeleteOutlined
            className="ml-12  white"
            style={{ cursor: 'pointer' }}
            onClick={onDelete}
          />
        </Popover>
      </div>
    </div>
  </div>
);

export default SkillListItem;
