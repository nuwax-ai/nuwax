import {
  CheckCircleFilled,
  CopyOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Checkbox, Select, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './runResult.less';
const cx = classNames.bind(styles);

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
        <span
          key={i}
          className={cx(styles.runResultPageItem, { active: current === i })}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </span>,
      );
    }

    return (
      <div className={cx(styles.runResultPagination)}>
        <div className={cx(styles.runResultPaginationPages)}>{pages}</div>
        <Select
          value={current}
          onChange={handlePageChange}
          options={Array.from({ length: total }, (_, i) => ({
            value: i + 1,
            label: i + 1,
          }))}
          size="small"
          className={cx(styles.runResultPageSelect)}
        />
      </div>
    );
  };

  // 渲染键值对
  const renderKeyValue = (obj: Record<string, any>, title: string) => {
    return (
      <div className={cx(styles.runResultSection)}>
        <div className={cx(styles.runResultSectionHeader)}>
          <span>{title}</span>
          <Tooltip title="复制">
            <CopyOutlined
              className={cx(styles.copyIcon)}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
              }}
            />
          </Tooltip>
        </div>
        <div className={cx(styles.runResultSectionContent)}>
          {Object.entries(obj).map(([key, value]) => (
            <div key={key} className={cx(styles.keyValueItem)}>
              <span className={cx(styles.key)}>{key} :</span>
              <span className={cx(styles.value)}>
                &quot;{String(value)}&quot;
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cx(styles.runResultContainer)}>
      <div className={cx(styles.runResultHeader)}>
        <div className={cx(styles.runResultStatus)}>
          <CheckCircleFilled
            className={cx(
              styles.statusIcon,
              success ? styles.success : styles.error,
            )}
          />
          <span className={cx(styles.statusText)}>
            {success ? '运行成功' : '运行失败'}
          </span>
          <span className={cx(styles.runTime)}>{time}</span>
        </div>
        {collapsible && (
          <div
            className={cx(styles.collapseIcon)}
            onClick={handleToggleCollapse}
          >
            {collapsed ? <DownOutlined /> : <UpOutlined />}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className={cx(styles.runResultBody)}>
          <div className={cx(styles.runResultInfo)}>
            <div className={cx(styles.totalCount)}>总数: {total}</div>
            {total > 1 && (
              <div className={cx(styles.onlyErrorCheckbox)}>
                <Checkbox checked={onlyError} onChange={handleOnlyErrorChange}>
                  只看错误
                </Checkbox>
              </div>
            )}
          </div>
          {(total > 1 && renderPagination()) || null}

          {Object.keys(batchVariables).length > 0 && (
            <div className={cx(styles.runResultBatch)}>
              <div className={cx(styles.runResultBatchHeader)}>
                <span>本次批处理变量</span>
                <Tooltip title="复制">
                  <CopyOutlined
                    className={cx(styles.copyIcon)}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(batchVariables, null, 2),
                      );
                    }}
                  />
                </Tooltip>
              </div>
              <div className={cx(styles.runResultBatchContent)}>
                {Object.entries(batchVariables).map(([key, value]) => (
                  <div key={key} className={cx(styles.keyValueItem)}>
                    <span className={cx(styles.key)}>{key} :</span>
                    <span className={cx(styles.value)}>
                      &quot;{String(value)}&quot;
                    </span>
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
