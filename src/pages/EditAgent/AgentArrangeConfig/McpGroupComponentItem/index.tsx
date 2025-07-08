import CollapseComponentList from '@/components/CollapseComponentList';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { McpGroupComponentItemProps } from '@/types/interfaces/agentConfig';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 分组MCP组件
const McpGroupComponentItem: React.FC<McpGroupComponentItemProps> = ({
  item,
  deleteList,
  onSet,
  onDel,
}) => {
  const [showChildren, setShowChildren] = useState<boolean>(false);

  return (
    <div className={cx(styles.container)}>
      <div
        className={cx('flex', 'items-center', styles['group-mcp-item'], {
          [styles.border]: showChildren,
        })}
      >
        <span className={cx('radius-6', styles['img-box'])}>
          <img src={item.icon} alt="" />
        </span>
        <div className={cx('flex', 'flex-col', 'flex-1', 'overflow-hide')}>
          <h3 className={cx('text-ellipsis', styles.name)}>{item.groupName}</h3>
          <p className={cx('text-ellipsis', styles.desc)}>
            {item.groupDescription}
          </p>
        </div>
        <div
          className={cx(
            styles['extra-box'],
            'flex',
            'items-center',
            'cursor-pointer',
          )}
          onClick={() => setShowChildren(!showChildren)}
        >
          <span>{`工具（${item.children.length}）`}</span>
          <DownOutlined
            className={cx(styles['down-icon'], {
              [styles['down-icon-rotate']]: showChildren,
            })}
          />
        </div>
      </div>
      {showChildren && (
        <CollapseComponentList
          textClassName={cx(styles.text)}
          itemClassName={cx(styles['group-mcp-item-children'])}
          type={AgentComponentTypeEnum.MCP}
          list={item.children}
          deleteList={deleteList}
          onSet={onSet}
          onDel={onDel}
        />
      )}
    </div>
  );
};

export default McpGroupComponentItem;
