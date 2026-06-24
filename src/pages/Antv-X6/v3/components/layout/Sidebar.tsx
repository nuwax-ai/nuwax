import { useFlowKind } from '@/contexts/FlowKindContext';
import { t } from '@/services/i18nRuntime';
import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import { StencilChildNode } from '@/types/interfaces/graph';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import React, { useMemo, useState } from 'react';
import '../../indexV3.less';
import { asideList } from '../../ParamsV3';

interface Prop {
  dragChild: (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement>,
  ) => void;
  isLoop?: boolean;
  portName?: string;
  flowKind?: FlowKindEnum;
}

const renderIcon = (url: string) => {
  return (
    <div
      className="icon-box-style"
      style={{
        width: '20px',
        height: '20px',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        ...(url && { backgroundImage: `url("${url}")` }),
      }}
    ></div>
  );
};

const StencilContent = ({
  dragChild,
  isLoop = false,
  flowKind: flowKindProp,
}: Prop) => {
  const flowKindFromCtx = useFlowKind();
  const flowKind = flowKindProp ?? flowKindFromCtx;
  const isAgentFlow = flowKind === FlowKindEnum.AgentFlow;
  const [searchText, setSearchText] = useState('');

  const matchesFlowKind = (child: StencilChildNode) =>
    !child.flowKinds || child.flowKinds.includes(flowKind);

  const handleDragStart = (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement>,
  ) => {
    dragChild(child, position);
  };

  const filteredGroups = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();
    return asideList
      .filter((item) => item.children.some(matchesFlowKind))
      .map((item) => ({
        ...item,
        children: item.children
          .filter(matchesFlowKind)
          .filter((child) => (isLoop ? child.type !== NodeTypeEnum.Loop : true))
          .filter((child) => {
            if (!keyword) return true;
            return child.name?.toLowerCase().includes(keyword);
          })
          .filter((child) => {
            const isLoopControl = [
              NodeTypeEnum.LoopBreak,
              NodeTypeEnum.LoopContinue,
            ].includes(child?.type || '');
            return isLoopControl ? isLoop : true;
          }),
      }))
      .filter((item) => item.children.length > 0);
  }, [asideList, flowKind, isLoop, searchText]);

  // AgentFlow: vertical list sidebar style
  if (isAgentFlow) {
    return (
      <div className="stencil-panel">
        <div className="stencil-panel-header">
          <Input
            placeholder={
              t('PC.Pages.AntvX6Stencil.searchPlaceholder') || 'Search nodes...'
            }
            prefix={<SearchOutlined />}
            size="small"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="stencil-search"
          />
        </div>
        <div className="stencil-panel-body">
          {filteredGroups.map((item) => (
            <div className="stencil-group" key={item.key}>
              {item.name && (
                <div className="stencil-group-title">{item.name}</div>
              )}
              <div className="stencil-group-content">
                {item.children.map((child, childIndex) => (
                  <div
                    className="stencil-node-item"
                    draggable="true"
                    key={`${child.type}-${childIndex}`}
                    onDragEnd={(e) => handleDragStart(child, e)}
                    onClick={() => handleDragStart(child)}
                  >
                    {renderIcon(child.bgIcon || '')}
                    <span className="stencil-node-label">{child.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <div className="stencil-empty">
              {t('PC.Pages.AntvX6Stencil.noMatches') || 'No matches found'}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Workflow v3: original two-column grid Popover stencil
  return (
    <div className="stencil-content">
      <p className="stencil-title">
        {t('PC.Pages.AntvX6Stencil.nodeSelectorTitle')}
      </p>
      <div className="stencil-list-style">
        {filteredGroups.map((item) => (
          <div className="stencil-list-item" key={item.key}>
            {item.name && <p className="stencil-list-title">{item.name}</p>}
            <div className="stencil-list-content">
              {item.children.map((child, childIndex) => (
                <div
                  className="child-content dis-left"
                  draggable="true"
                  key={`${child.type}-${childIndex}`}
                  onDragEnd={(e) => handleDragStart(child, e)}
                  onClick={() => handleDragStart(child)}
                >
                  {renderIcon(child.bgIcon || '')}
                  <span>{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StencilContent;
