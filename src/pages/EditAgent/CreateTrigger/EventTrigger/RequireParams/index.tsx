import TooltipIcon from '@/components/TooltipIcon';
import { VARIABLE_TYPE_LIST } from '@/constants/common.constants';
import {
  DownOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Input, Select } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const RequireParams: React.FC = () => {
  return (
    <div className={cx(styles['require-params'], 'radius-6')}>
      <div className={cx('flex', styles['r-header'])}>
        <DownOutlined className={cx(styles['dropdown-icon'])} />
        <span>请求参数</span>
        <TooltipIcon
          title="用于其他系统对Webhook URL发出的POST请求中RequestBody需遵循的JSON格式，触发任务将基于该消息格式执行后续动作"
          icon={<InfoCircleOutlined />}
        />
        <span
          className={cx(
            'hover-box',
            'cursor-pointer',
            'flex',
            'items-center',
            'content-center',
            styles['plus-icon'],
          )}
        >
          <PlusOutlined />
        </span>
      </div>
      <ul>
        <li className={cx('flex', 'items-center', styles['r-table-row'])}>
          <div className={cx(styles['var-name'])}>变量名</div>
          <div className={cx(styles['var-type'])}>变量类型</div>
          <div className={cx(styles.desc)}>描述</div>
        </li>
        <li className={cx('flex', 'items-center', styles['r-table-row'])}>
          <div className={cx(styles['var-name'])}>
            <Input size="small" placeholder="输入变量名" />
          </div>
          <div className={cx(styles['var-type'])}>
            <Select size="small" options={VARIABLE_TYPE_LIST} />
          </div>
          <div className={cx(styles.desc, 'flex')}>
            <Input size="small" placeholder="请描述变量用途" />
            <MinusCircleOutlined
              className={cx('cursor-pointer', styles['reduce-icon'])}
            />
          </div>
        </li>
      </ul>
    </div>
  );
};

export default RequireParams;
