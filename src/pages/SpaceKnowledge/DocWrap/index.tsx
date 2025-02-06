import { FileSearchOutlined, SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 文档列表（带搜索文档）
 */
const DocWrap: React.FC = () => {
  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <Input
        placeholder="搜索"
        size="large"
        prefix={<SearchOutlined className={cx(styles['search-icon'])} />}
      />
      <p className={cx(styles['document-title'])}>文档列表</p>
      <ul className={cx('flex-1', 'overflow-y')}>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档1.txt</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
            styles.active,
          )}
        >
          <FileSearchOutlined />
          <span>文档2.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
        <li
          className={cx(
            styles['file-info'],
            'flex',
            'items-center',
            'radius-6',
          )}
        >
          <FileSearchOutlined />
          <span>文档3.doc</span>
        </li>
      </ul>
    </div>
  );
};

export default DocWrap;
