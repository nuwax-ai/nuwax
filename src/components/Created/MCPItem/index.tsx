import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import { DownOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import React, { useState } from 'react';
import MCPTools from '../MCPTools';

import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MCPItemProps {
  item: CreatedNodeItem;
  index: number;
  selected: { key: string };
  onAddNode: (item: CreatedNodeItem) => void;
  addedComponents: AgentAddComponentStatusInfo[];
  getToolLoading: (item: CreatedNodeItem) => boolean | undefined;
}
const MCPItem: React.FC<MCPItemProps> = ({
  item,
  index,
  selected,
  onAddNode,
  getToolLoading,
  addedComponents,
}) => {
  // 默认折叠
  const [fold, setFold] = useState(true);

  return (
    <>
      <div
        className={cx('dis-sb', styles.container, 'cursor-pointer')}
        style={{ height: 'unset' }}
        key={`${item.targetId}-${index}`}
        onClick={() => setFold(!fold)}
      >
        <img
          src={item.icon || getImg(selected.key as AgentComponentTypeEnum)}
          alt=""
          className={cx(styles['left-image-style'])}
        />
        <div className={cx('flex-1', styles['content-font'])}>
          <p className={cx(styles['label-font-style'])}>{item.name}</p>
          <p
            className={cx(
              styles['created-description-style'],
              'text-ellipsis-2',
            )}
            title={item.description}
          >
            {item.description}
          </p>
          <div className={cx('dis-sb', styles['count-div-style'])}>
            <div className={'dis-left'}>
              <img
                src={
                  item.publishUser?.avatar ||
                  require('@/assets/images/avatar.png')
                }
                style={{ borderRadius: '50%' }}
                alt="用户头像"
              />
              <span>{item.publishUser?.nickName}</span>
              <Divider type="vertical" />
              <span>
                {'部署于'}
                {getTime(item.deployed!)}
              </span>
            </div>
          </div>
        </div>
        <DownOutlined
          onClick={() => setFold(!fold)}
          className={cx(styles['fold-icon-style'])}
          style={{
            transform: fold ? 'rotate(-90deg)' : 'rotate(0)',
          }}
        />
      </div>
      <MCPTools
        fold={fold}
        tools={item?.config?.tools || []}
        item={item}
        getToolLoading={getToolLoading}
        onAddTool={onAddNode}
        addedComponents={addedComponents}
      />
    </>
  );
};

export default MCPItem;
