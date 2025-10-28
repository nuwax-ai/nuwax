import { McpEditItemProps } from '@/types/interfaces/mcp';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// MCP服务编辑试运行项
const McpEditItem: React.FC<McpEditItemProps> = ({
  name,
  description,
  onClick,
}) => {
  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'gap-10')}>
      <header className={cx('flex', 'items-center', 'content-between')}>
        <h6 className={cx(styles.name)}>{name}</h6>
        <Button className={cx(styles.btn)} onClick={onClick}>
          试运行
        </Button>
      </header>
      <p className={cx(styles.desc, 'text-ellipsis-3')}>{description}</p>
    </div>
  );
};

export default McpEditItem;
