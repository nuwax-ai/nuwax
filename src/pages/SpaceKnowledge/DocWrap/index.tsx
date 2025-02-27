import type { DocWrapProps } from '@/types/interfaces/knowledge';
import { FileSearchOutlined, SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 文档列表（带搜索文档）
 */
const DocWrap: React.FC<DocWrapProps> = ({
  currentDocId,
  onChange,
  documentList,
  onClick,
}) => {
  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <Input
        placeholder="搜索"
        size="large"
        onChange={(e) => onChange(e.target.value)}
        prefix={<SearchOutlined className={cx(styles['search-icon'])} />}
      />
      <p className={cx(styles['document-title'])}>文档列表</p>
      <ul className={cx('flex-1', 'overflow-y')}>
        {documentList?.map((item) => (
          <li
            key={item.id}
            onClick={() => onClick(item)}
            className={cx(
              styles['file-info'],
              'flex',
              'items-center',
              'radius-6',
              { [styles.active]: currentDocId === item.id },
            )}
          >
            <FileSearchOutlined />
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocWrap;
