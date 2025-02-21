import { ChildNode } from '@/types/interfaces/graph';
import { CloseOutlined } from '@ant-design/icons';
import React from 'react';
interface ErrorItem extends ChildNode {
  error: string;
  nodeId: number | string;
}

interface ErrorListProps {
  // 右侧节点抽屉是否在显示，根据这个变量来处理div的宽度
  visible: boolean;
  // 当前要展示的错误列表
  errorList: ErrorItem[];
  // 打开或者关闭
  show: boolean;
  onClose: () => void;
  changeDrawer: (child: ChildNode) => void;
  nodeList: ChildNode[];
}

const ErrorList: React.FC<ErrorListProps> = ({
  visible,
  errorList,
  show,
  onClose,
  changeDrawer,
  nodeList,
}) => {
  return (
    <div
      style={{
        right: visible ? '400px' : '10px',
        display: show ? 'block' : 'none',
      }}
      className="error-list-style"
    >
      {/* 头部信息 */}
      <div className="dis-sb error-list-header">
        <span>错误列表</span>
        <CloseOutlined onClick={onClose} />
      </div>

      {/* 遍历当前的错误信息列表 */}
      {nodeList && (
        <div className="error-list-content">
          {errorList.map((item) => {
            const node = nodeList.find((node) => node.id === item.nodeId);
            console.log(node);
            if (node) {
              return (
                <div
                  className="dis-left error-list-item"
                  onClick={() => changeDrawer(node)}
                  key={item.nodeId}
                >
                  <img src={node.icon} alt="" />
                  <div>
                    <p>{node.name || '123'}</p>
                    <p className="error-text">{item.error}</p>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default ErrorList;
