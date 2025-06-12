import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { Checkbox, Select, Tooltip } from 'antd';
import React, { useState } from 'react';
import './runResult.less';

interface RunResultProps {
  /**
   * 运行是否成功
   */
  success?: boolean;
  /**
   * 运行耗时
   */
  time?: string;
  /**
   * 总结果数
   */
  total?: number;
  /**
   * 当前页码
   */
  current?: number;
  /**
   * 是否只看错误
   */
  onlyError?: boolean;
  /**
   * 页码变化回调
   */
  onPageChange?: (page: number) => void;
  /**
   * 只看错误变化回调
   */
  onOnlyErrorChange?: (checked: boolean) => void;
  /**
   * 批处理变量
   */
  batchVariables?: Record<string, any>;
  /**
   * 输入参数
   */
  inputParams?: Record<string, any>;
  /**
   * 输出结果
   */
  outputResult?: Record<string, any>;
  /**
   * 是否显示展开/收起
   */
  collapsible?: boolean;
  /**
   * 是否展开
   */
  expanded?: boolean;
  /**
   * 展开/收起回调
   */
  onExpandChange?: (expanded: boolean) => void;
}

/**
 * 运行结果组件
 */
const RunResult: React.FC<RunResultProps> = ({
  success = true,
  time = '0.001s',
  total = 10,
  current = 1,
  onlyError = false,
  onPageChange,
  onOnlyErrorChange,
  batchVariables = {},
  inputParams = {},
  outputResult = {},
  collapsible = true,
  expanded = false,
  onExpandChange,
}) => {
  const [collapsed, setCollapsed] = useState(!expanded);

  // 处理展开/收起
  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onExpandChange?.(!newCollapsed);
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  // 处理只看错误变化
  const handleOnlyErrorChange = (e: any) => {
    onOnlyErrorChange?.(e.target.checked);
  };

  // 渲染分页按钮
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    const startPage = Math.max(
      1,
      Math.min(current - Math.floor(maxVisible / 2), total - maxVisible + 1),
    );
    const endPage = Math.min(startPage + maxVisible - 1, total);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <div
          key={i}
          className={`run-result-page-item ${current === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </div>,
      );
    }

    return (
      <div className="run-result-pagination">
        {pages}
        <Select
          value={current}
          onChange={handlePageChange}
          options={Array.from({ length: total }, (_, i) => ({
            value: i + 1,
            label: i + 1,
          }))}
          className="run-result-page-select"
          suffixIcon={<div className="select-arrow">▼</div>}
        />
      </div>
    );
  };

  // 渲染键值对
  const renderKeyValue = (obj: Record<string, any>, title: string) => {
    return (
      <div className="run-result-section">
        <div className="run-result-section-header">
          <span>{title}</span>
          <Tooltip title="复制">
            <CopyOutlined
              className="copy-icon"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
              }}
            />
          </Tooltip>
        </div>
        <div className="run-result-section-content">
          {Object.entries(obj).map(([key, value]) => (
            <div key={key} className="key-value-item">
              <span className="key">{key} :</span>
              <span className="value">&quot;{String(value)}&quot;</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="run-result-container">
      <div className="run-result-header">
        <div className="run-result-status">
          <CheckCircleFilled
            className={`status-icon ${success ? 'success' : 'error'}`}
          />
          <span className="status-text">
            {success ? '运行成功' : '运行失败'}
          </span>
          <span className="run-time">{time}</span>
        </div>
        {collapsible && (
          <div className="collapse-icon" onClick={handleToggleCollapse}>
            {collapsed ? '▼' : '▲'}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="run-result-body">
          <div className="run-result-info">
            <div className="total-count">总数: {total}</div>
            {total > 1 && (
              <>
                {renderPagination()}
                <div className="only-error-checkbox">
                  <Checkbox
                    checked={onlyError}
                    onChange={handleOnlyErrorChange}
                  >
                    只看错误
                  </Checkbox>
                </div>
              </>
            )}
          </div>

          {Object.keys(batchVariables).length > 0 && (
            <div className="run-result-batch">
              <div className="run-result-batch-header">
                <span>本次批处理变量</span>
                <Tooltip title="复制">
                  <CopyOutlined
                    className="copy-icon"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(batchVariables, null, 2),
                      );
                    }}
                  />
                </Tooltip>
              </div>
              <div className="run-result-batch-content">
                {Object.entries(batchVariables).map(([key, value]) => (
                  <div key={key} className="key-value-item">
                    <span className="key">{key} :</span>
                    <span className="value">&quot;{String(value)}&quot;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderKeyValue(inputParams, '输入')}
          {renderKeyValue(outputResult, '输出')}
        </div>
      )}
    </div>
  );
};

export default RunResult;
