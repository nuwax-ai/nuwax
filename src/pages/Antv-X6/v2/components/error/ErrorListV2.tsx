/**
 * V2 错误列表组件
 *
 * 显示工作流验证错误和试运行错误
 * 参考 V1 实现
 */

import { CloseOutlined } from '@ant-design/icons';
import { Button, Popover, theme } from 'antd';
import React from 'react';

import { getNodeTypeIconV2 } from '../../constants/stencilConfigV2';
import type { ChildNodeV2 } from '../../types';

import './ErrorListV2.less';

// ==================== 类型定义 ====================

export interface ErrorItemV2 {
  /** 节点 ID */
  nodeId?: number;
  /** 错误信息 */
  error: string;
  /** 错误类型 */
  type?: 'validation' | 'runtime';
}

export interface ErrorListV2Props {
  /** 右侧节点抽屉是否在显示 */
  drawerVisible?: boolean;
  /** 错误列表 */
  errorList: ErrorItemV2[];
  /** 是否显示错误面板 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 节点列表 */
  nodeList: ChildNodeV2[];
  /** 点击错误项回调 */
  onClickItem?: (node: ChildNodeV2) => void;
}

// ==================== 常量 ====================

const MAX_ERROR_LENGTH = 500;

// ==================== 工具函数 ====================

/**
 * 截断错误内容
 */
const getDisplayErrorContent = (error: string): string => {
  return (error || '').length > MAX_ERROR_LENGTH
    ? error.slice(0, MAX_ERROR_LENGTH) + '...'
    : error;
};

// ==================== 组件实现 ====================

const ErrorListV2: React.FC<ErrorListV2Props> = ({
  drawerVisible = false,
  errorList,
  visible,
  onClose,
  onClickItem,
  nodeList,
}) => {
  const { token } = theme.useToken();

  if (!visible) {
    return null;
  }

  return (
    <div
      className="error-list-v2"
      style={{
        right: drawerVisible ? '388px' : '10px',
      }}
    >
      {/* 头部 */}
      <div className="error-list-v2-header">
        <span className="error-list-v2-title">
          错误列表 ({errorList.length})
        </span>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onClose}
        />
      </div>

      {/* 错误列表内容 */}
      <div className="error-list-v2-content">
        {errorList.length === 0 ? (
          <div className="error-list-v2-empty">暂无错误</div>
        ) : (
          errorList.map((item, index) => {
            // 有节点 ID 的错误
            if (item.nodeId) {
              const node = nodeList.find((n) => n.id === item.nodeId);
              if (!node) {
                return null;
              }

              const NodeIcon = getNodeTypeIconV2(node.type);

              return (
                <div
                  key={`${item.nodeId}-${index}`}
                  className="error-list-v2-item"
                  onClick={() => onClickItem?.(node)}
                >
                  <div className="error-list-v2-item-icon">
                    {NodeIcon && <NodeIcon />}
                  </div>
                  <div className="error-list-v2-item-content">
                    <div className="error-list-v2-item-name">
                      {node.name || '未命名节点'}
                    </div>
                    {item.error.length > 110 ? (
                      <Popover
                        content={
                          <p style={{ maxWidth: 400 }}>
                            {getDisplayErrorContent(item.error)}
                          </p>
                        }
                        trigger="hover"
                        mouseEnterDelay={0.5}
                        placement="top"
                      >
                        <div className="error-list-v2-item-error">
                          {item.error}
                        </div>
                      </Popover>
                    ) : (
                      <div className="error-list-v2-item-error">
                        {item.error}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // 没有节点 ID 的全局错误
            return (
              <div
                key={`global-${index}`}
                className="error-list-v2-item global"
              >
                {item.error.length > 200 ? (
                  <Popover
                    content={
                      <p style={{ maxWidth: 400 }}>
                        {getDisplayErrorContent(item.error)}
                      </p>
                    }
                    trigger="hover"
                    mouseEnterDelay={0.5}
                    placement="top"
                  >
                    <div
                      className="error-list-v2-item-error"
                      style={{ color: token.colorError }}
                    >
                      {item.error}
                    </div>
                  </Popover>
                ) : (
                  <div
                    className="error-list-v2-item-error"
                    style={{ color: token.colorError }}
                  >
                    {item.error}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ErrorListV2;
