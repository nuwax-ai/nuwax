import { ChildNode } from '@/types/interfaces/graph';
import { ErrorItem } from '@/types/interfaces/workflow';
import { returnImg } from '@/utils/workflow';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Popover } from 'antd'; // 引入 Popover
import React from 'react';
import { useModel } from 'umi';
import './index.less';
const MAX_ERROR_LENGTH = 500;

const getDisplayErrorContent = (error: string) => {
  return (error || '').length > MAX_ERROR_LENGTH
    ? error.slice(0, MAX_ERROR_LENGTH) + '...'
    : error;
};

interface ErrorListProps {
  // 右侧节点抽屉是否在显示，根据这个变量来处理div的宽度
  visible: boolean;
  // 当前要展示的错误列表
  errorList: ErrorItem[];
  // 打开或者关闭
  show: boolean;
  onClose: () => void;
  nodeList: ChildNode[];
  onClickItem: (node: ChildNode) => void;
}

const ErrorList: React.FC<ErrorListProps> = ({
  visible,
  errorList,
  show,
  onClose,
  onClickItem,
  nodeList,
}) => {
  const { setVolid } = useModel('workflow');
  return (
    <div
      style={{
        right: visible ? '388px' : '10px',
        display: show ? 'flex' : 'none',
        flexDirection: 'column',
      }}
      className="error-list-style dis-col"
    >
      {/* 头部信息 */}
      <div
        className="dis-sb error-list-header"
        style={{
          height: '48px',
        }}
      >
        <span>错误列表</span>
        <Button
          type="text"
          icon={<CloseOutlined />}
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
                  className="dis-left error-list-item hover-box"
                  onClick={() => {
                    onClickItem(node);
                    setVolid(true);
                  }}
                  key={item.nodeId}
                >
                  <div className="image-div-style">{returnImg(node.type)}</div>
                  <div className="content-error-item-width">
                    <p className="error-node-name">{node.name || '暂无'}</p>
                    {item.error.length > 110 ? (
                      <Popover
                        content={<p>{getDisplayErrorContent(item.error)}</p>} // Popover 内容 超出 500 字符时 支持截断
                        trigger="hover" // 鼠标悬停触发
                        mouseEnterDelay={0.5} // 延迟 0.5 秒显示
                        placement="top" // 显示在顶部左侧
                        open={undefined} // 移除 open 属性，由 hover 触发
                      >
                        <p className="error-text">{item.error}</p>
                      </Popover>
                    ) : (
                      <p className="error-text">{item.error}</p>
                    )}
                  </div>
                </div>
              );
            } else {
              if (item) {
                return (
                  <div className="dis-left error-list-item" key={item.error}>
                    {item.error.length > 3000 ? (
                      <Popover
                        content={<p>{item.error}</p>} // Popover 内容
                        trigger="hover" // 鼠标悬停触发
                        mouseEnterDelay={0.5} // 延迟 0.5 秒显示
                        placement="top" // 显示在顶部左侧
                        open={undefined} // 移除 open 属性，由 hover 触发
                      >
                        <p className="error-text">{item.error}</p>
                      </Popover>
                    ) : (
                      <p className="error-text">{item.error}</p>
                    )}
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
