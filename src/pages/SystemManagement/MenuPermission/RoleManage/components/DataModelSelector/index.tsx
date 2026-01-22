import { DatabaseOutlined } from '@ant-design/icons';
import { Checkbox } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { DataModelInfo } from '../../type';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DataModelSelectorProps {
  /** 数据模型列表 */
  models: DataModelInfo[];
  /** 选中的模型ID列表 */
  selectedIds: number[];
  /** 选择变化回调 */
  onChange: (selectedIds: number[]) => void;
}

/**
 * 数据模型选择器组件
 * 以卡片形式展示数据模型，支持多选
 */
const DataModelSelector: React.FC<DataModelSelectorProps> = ({
  models,
  selectedIds,
  onChange,
}) => {
  // 处理模型选择
  const handleModelToggle = (modelId: number, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, modelId]);
    } else {
      onChange(selectedIds.filter((id) => id !== modelId));
    }
  };

  // 处理"全部模型"选择
  const handleAllModelsToggle = (checked: boolean) => {
    if (checked) {
      // 选中全部模型
      onChange(models.map((model) => model.id));
    } else {
      // 取消选中全部
      onChange([]);
    }
  };

  // 检查是否选中了全部模型
  const isAllSelected =
    models.length > 0 && selectedIds.length === models.length;

  return (
    <div className={cx(styles.container)}>
      {/* 全部模型选项 - 单独占一行 */}
      <div
        className={cx(styles.modelCard, styles.allModelCard, {
          [styles.selected]: isAllSelected,
        })}
        onClick={() => handleAllModelsToggle(!isAllSelected)}
      >
        <div className={cx(styles.modelIcon)}>
          <DatabaseOutlined />
        </div>
        <div className={cx(styles.modelContent)}>
          <div className={cx(styles.modelName)}>全部模型</div>
          <div className={cx(styles.modelDesc)}>拥有所有模型的数据权限</div>
        </div>
        <Checkbox
          checked={isAllSelected}
          onChange={(e) => {
            e.stopPropagation();
            handleAllModelsToggle(e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* 具体模型列表 - 2列布局 */}
      <div className={cx(styles.modelGrid)}>
        {models.map((model) => {
          const isSelected = selectedIds.includes(model.id);
          return (
            <div
              key={model.id}
              className={cx(styles.modelCard, {
                [styles.selected]: isSelected,
              })}
              onClick={() => handleModelToggle(model.id, !isSelected)}
            >
              <div className={cx(styles.modelIcon)}>
                <DatabaseOutlined />
              </div>
              <div className={cx(styles.modelContent)}>
                <div className={cx(styles.modelName)}>{model.name}</div>
                <div className={cx(styles.modelDesc)}>{model.description}</div>
              </div>
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  handleModelToggle(model.id, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataModelSelector;
