import CopyIconButton from '@/components/base/CopyIconButton';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined,
  LoadingOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Checkbox, Select } from 'antd';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
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
  /**
   * 是否正在运行
   */
  loading?: boolean;
  /**
   * 标题
   */
  title?: string;
}
const DEFAULT_SHOW_MAX_PAGE = 5;

/**
 * 运行结果组件
 */
const RunResult: React.FC<RunResultProps> = ({
  success = true,
  loading = false,
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
  title = '',
  onExpandChange,
}) => {
  const runResultRef = useRef<HTMLDivElement>(null);
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
    const theLength = Math.min(DEFAULT_SHOW_MAX_PAGE, total);

    for (let i = 1; i <= theLength; i++) {
      pages.push(
        <span
          key={i}
          className={cx(styles.runResultPageItem, {
            [styles.active]: current === i,
          })}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </span>,
      );
    }

    return (
      <div className={cx(styles.runResultPagination)}>
        <div className={cx(styles.runResultPaginationPages)}>{pages}</div>
        <div className={cx(styles.runResultPageSelect)}>
          {total > DEFAULT_SHOW_MAX_PAGE && (
            <Select
              value={current}
              onChange={handlePageChange}
              options={Array.from({ length: total }, (_, i) => ({
                value: i + 1,
                label: i + 1,
              }))}
              listHeight={100}
              className={styles.runResultPageSelectRoot}
              size="small"
              getPopupContainer={() => runResultRef.current as HTMLElement}
            />
          )}
        </div>
      </div>
    );
  };

  // 渲染键值对
  const renderKeyValue = (obj: Record<string, any>, title: string) => {
    return (
      <div className={cx(styles.runResultSection)}>
        <div className={cx(styles.runResultSectionHeader)}>
          <span>{title}</span>
          <CopyIconButton data={obj} jsonSpace={2} tooltipTitle="复制" />
        </div>
        <div className={cx(styles.runResultSectionContent, 'overflow-y')}>
          <code>{JSON.stringify(obj, null, 2)}</code>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={runResultRef}
      className={cx(styles.runResultContainer)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className={cx(styles.runResultHeader)}>
        <div className={cx(styles.runResultStatus)}>
          {loading ? (
            <LoadingOutlined className={cx(styles.statusIcon)} />
          ) : success ? (
            <CheckCircleFilled
              className={cx(styles.statusIcon, styles.success)}
            />
          ) : (
            <CloseCircleFilled
              className={cx(styles.statusIcon, styles.error)}
            />
          )}
          <span className={cx(styles.statusText)}>
            {title || (loading ? '运行中' : success ? '运行成功' : '运行失败')}
          </span>
          {!loading && <span className={cx(styles.runTime)}>{time}</span>}
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
            {total > 1 && !success && (
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
                <CopyIconButton
                  data={batchVariables}
                  jsonSpace={2}
                  tooltipTitle="复制"
                />
              </div>
              <div className={cx(styles.runResultSectionContent, 'overflow-y')}>
                <pre>{JSON.stringify(batchVariables, null, 2)}</pre>
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
