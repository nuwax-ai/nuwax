import { ChildNode } from '@/types/interfaces/graph';
import { CloseOutlined } from '@ant-design/icons';
import React from 'react';
interface ErrorItem extends ChildNode {
  error: string;
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
}

const ErrorList: React.FC<ErrorListProps> = ({
  visible,
  errorList,
  show,
  onClose,
  changeDrawer,
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
      <div className="error-list-content">
        {errorList.map((item, index) => (
          <div
            className="dis-left error-list-item"
            onClick={() => changeDrawer(item)}
            key={index}
          >
            <img src={item.icon} alt="" />
            <div>
              <p>{item.name || '123'}</p>
              <p className="error-text">{item.error}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorList;
