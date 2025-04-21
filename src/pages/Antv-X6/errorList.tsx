import { ChildNode } from '@/types/interfaces/graph';
import { ErrorItem } from '@/types/interfaces/workflow';
import { returnImg } from '@/utils/workflow';
import { CloseOutlined } from '@ant-design/icons';
import { Popover } from 'antd'; // 引入 Popover
import React from 'react';
import { useModel } from 'umi';
import './index.less';

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
  const { setVolid } = useModel('workflow');
  return (
    <div
      style={{
        right: visible ? '388px' : '10px',
        display: show ? 'block' : 'none',
      }}
      className="error-list-style dis-col"
    >
      {/* 头部信息 */}
      <div className="dis-sb error-list-header">
        <span>错误列表</span>
        <CloseOutlined
          onClick={() => {
            onClose();
            setVolid(false);
          }}
        />
      </div>

      {/* 遍历当前的错误信息列表 */}
      {errorList && (
        <div className="error-list-content">
          {errorList.map((item) => {
            if (item && item.nodeId) {
              const node = nodeList.find((node) => node.id === item.nodeId);
              if (!node) {
                return null;
              }
              return (
                <div
                  className="dis-left error-list-item"
                  onClick={() => {
                    changeDrawer(node);
                    setVolid(true);
                  }}
                  key={item.nodeId}
                >
                  {returnImg(node.type)}
                  <div className="ml-12">
                    <p>{node.name || '123'}</p>
                    <Popover
                      content={<p>{item.error}</p>} // Popover 内容
                      trigger="hover" // 鼠标悬停触发
                      mouseEnterDelay={0.5} // 延迟 0.5 秒显示
                      placement="top" // 显示在顶部左侧
                      open={undefined} // 移除 open 属性，由 hover 触发
                    >
                      <p className="error-text">{item.error}</p>
                    </Popover>
                  </div>
                </div>
              );
            } else {
              if (item) {
                return (
                  <div className="dis-left error-list-item" key={item.error}>
                    <Popover
                      content={<p>{item.error}</p>} // Popover 内容
                      trigger="hover" // 鼠标悬停触发
                      mouseEnterDelay={0.5} // 延迟 0.5 秒显示
                      placement="top" // 显示在顶部左侧
                      open={item.error.length > 50 ? true : false} // 如果内容不超过 50 字符，不显示 Popover
                    >
                      <p className="error-text">{item.error}</p>
                    </Popover>
                  </div>
                );
              }
              return null; // 添加这一行以确保在所有情况下都有返回值
            }
          })}
        </div>
      )}
    </div>
  );
};

export default ErrorList;
