import {
  DeleteOutlined,
  FileSearchOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 文件信息
 */
const FileInfo: React.FC = () => {
  const handleChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
  };

  return (
    <div className={cx('flex-1', 'flex', 'flex-col', 'overflow-hide')}>
      <header className={cx(styles.header, 'flex', 'items-center')}>
        <FileSearchOutlined />
        <span>文档一.txt</span>
        <FormOutlined className={cx('cursor-pointer')} />
        <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
          <span className={cx(styles['switch-name'])}>预览原始文档</span>
          <Switch defaultChecked onChange={handleChange} />
          <DeleteOutlined className={cx(styles.del, 'cursor-pointer')} />
        </div>
      </header>
      <ul className={cx('px-16', 'py-16', 'flex-1', 'overflow-y')}>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
        <li className={cx(styles.line, 'radius-6')}>这里是文档内容段落</li>
      </ul>
    </div>
  );
};

export default FileInfo;
