import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import { DownOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import React, { useState } from 'react';
import MCPTools from './MCPTools';

interface MCPItemProps {
  item: CreatedNodeItem;
  index: number;
  selected: { key: string };
  onAddNode: (item: CreatedNodeItem) => void;
  addedComponents: AgentAddComponentStatusInfo[];
  getToolLoading: (
    item: CreatedNodeItem,
    toolName: string,
  ) => boolean | undefined;
}
const MCPItem: React.FC<MCPItemProps> = ({
  item,
  index,
  selected,
  onAddNode,
  getToolLoading,
  addedComponents,
}) => {
  const isFirstItem = index === 0;
  const [fold, setFold] = useState(isFirstItem ? false : true);

  return (
    <>
      <div
        className="dis-sb list-item-style cursor-pointer"
        style={{ height: 'unset' }}
        key={`${item.targetId}-${index}`}
        onClick={() => setFold(!fold)}
      >
        <img
          src={item.icon || getImg(selected.key as AgentComponentTypeEnum)}
          alt=""
          className="left-image-style"
        />
        <div className="flex-1 content-font">
          <p className="label-font-style margin-bottom-6">{item.name}</p>
          <p
            className="margin-bottom-6 created-description-style text-ellipsis-2"
            title={item.description}
          >
            {item.description}
          </p>
          <div className="dis-sb count-div-style">
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
              <span className="margin-left-6">
                {'部署于'}
                {getTime(item.deployed!)}
              </span>
            </div>
          </div>
        </div>
        <DownOutlined
          onClick={() => setFold(!fold)}
          className="fold-icon-style"
          style={{
            transform: fold ? 'rotate(0deg)' : 'rotate(180deg)',
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
