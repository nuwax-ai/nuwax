import FoldWrap from '@/components/FoldWrap';
import { ChildNode } from '@/types/interfaces/workflow';
import { returnImg } from '@/utils/workflow';
import React from 'react';
import FoldWarpNode from './component/disposeNode';

interface NodeDrawerProps {
  visible: boolean;
  onClose: () => void;
  foldWrapItem: ChildNode;
}

const NodeDrawer: React.FC<NodeDrawerProps> = ({
  visible,
  onClose,
  foldWrapItem,
}) => (
  <FoldWrap
    className="fold-wrap-style"
    lineMargin
    title={foldWrapItem.name}
    visible={visible}
    onClose={onClose}
    desc={foldWrapItem.description}
    icon={returnImg(foldWrapItem.type)}
  >
    <div className="dispose-node-style">
      <FoldWarpNode params={foldWrapItem} />
    </div>
  </FoldWrap>
);

export default NodeDrawer;
