import { useFlowKind } from '@/contexts/FlowKindContext';
import { t } from '@/services/i18nRuntime';
import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import { StencilChildNode } from '@/types/interfaces/graph';
import React, { useMemo } from 'react';
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

  const matchesFlowKind = (child: StencilChildNode) =>
    !child.flowKinds || child.flowKinds.includes(flowKind);

  const handleDragStart = (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement>,
  ) => {
    dragChild(child, position);
  };

  const isAgentFlow = flowKind === FlowKindEnum.AgentFlow;

  const filteredGroups = useMemo(() => {
    return asideList
      .filter((item) => item.children.some(matchesFlowKind))
      .map((item) => ({
        ...item,
        children: item.children
          .filter(matchesFlowKind)
          .filter((child) => (isLoop ? child.type !== NodeTypeEnum.Loop : true))
          .filter((child) => {
            const isLoopControl = [
              NodeTypeEnum.LoopBreak,
              NodeTypeEnum.LoopContinue,
            ].includes(child?.type || '');
            return isLoopControl ? isLoop : true;
          }),
      }))
      .filter((item) => item.children.length > 0);
  }, [asideList, flowKind, isLoop]);

  /** AgentFlow：合并所有分组节点为单一列表，不展示分组标题 */
  const flatChildren = useMemo(() => {
    if (!isAgentFlow) return [];
    return filteredGroups.flatMap((item) => item.children);
  }, [filteredGroups, isAgentFlow]);

  const renderChildNode = (child: StencilChildNode, childIndex: number) => (
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
  );

  // 节点选择面板：Workflow 按分组展示；AgentFlow 合并为单一两列网格
  return (
    <div className="stencil-content">
      <p className="stencil-title">
        {t('PC.Pages.AntvX6Stencil.nodeSelectorTitle')}
      </p>
      <div className="stencil-list-style">
        {isAgentFlow ? (
          <div className="stencil-list-item">
            <div className="stencil-list-content">
              {flatChildren.map(renderChildNode)}
            </div>
          </div>
        ) : (
          filteredGroups.map((item) => (
            <div className="stencil-list-item" key={item.key}>
              {item.name && <p className="stencil-list-title">{item.name}</p>}
              <div className="stencil-list-content">
                {item.children.map(renderChildNode)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StencilContent;
