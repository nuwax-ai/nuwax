import ConditionRender from '@/components/ConditionRender';
import type { RawSegmentInfoProps } from '@/types/interfaces/knowledge';
import {
  DeleteOutlined,
  FileSearchOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { Empty, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 文件 - 分段配置信息
 */
const RawSegmentInfo: React.FC<RawSegmentInfoProps> = ({
  onDel,
  documentInfo,
  rawSegmentInfoList,
}) => {
  const handleChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
  };

  return (
    <div className={cx('flex-1', 'flex', 'flex-col', 'overflow-hide')}>
      <header className={cx(styles.header, 'flex', 'items-center')}>
        <ConditionRender condition={!!documentInfo}>
          <FileSearchOutlined />
          <span>{documentInfo?.name}</span>
          <FormOutlined className={cx('cursor-pointer')} />
          <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
            <span className={cx(styles['switch-name'])}>预览原始文档</span>
            <Switch defaultChecked onChange={handleChange} />
            <DeleteOutlined
              className={cx(styles.del, 'cursor-pointer')}
              onClick={onDel}
            />
          </div>
        </ConditionRender>
      </header>
      {rawSegmentInfoList?.length > 0 ? (
        <ul className={cx('px-16', 'py-16', 'flex-1', 'overflow-y')}>
          {rawSegmentInfoList?.map((info) => (
            <li key={info.id} className={cx(styles.line, 'radius-6')}>
              {info.rawTxt}
            </li>
          ))}
        </ul>
      ) : (
        <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
          <Empty description="暂无分段" />
        </div>
      )}
    </div>
  );
};

export default RawSegmentInfo;
