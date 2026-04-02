/**
 * 数据权限弹窗 —「模型」Tab 面板
 *
 * 功能：双栏布局；左侧为系统模型列表（可勾选加入权限），右侧为当前角色/用户组已选模型。
 * 数据与请求由父组件 DataPermissionModal 维护，本组件仅负责展示与交互回调。
 *
 * @see DataPermissionModal
 */
import Loading from '@/components/custom/Loading';
import type { ModelConfigDto } from '@/types/interfaces/systemManage';
import classNames from 'classnames';
import React from 'react';
import ResourceItem from '../components/ResourceItem';
import styles from '../index.less';

const cx = classNames.bind(styles);

/** 模型 Tab：列表数据、选中态与增删回调均由父组件注入 */
export interface ModelTabPanelProps {
  /** 模型列表加载中 */
  modelLoading: boolean;
  /** 左侧可选模型（来自系统模型接口） */
  modelList?: ModelConfigDto[];
  /** 已选模型 id 列表，用于左侧 ResourceItem 的 isAdded */
  selectedModelIds: number[];
  /** 右侧已选模型详情列表 */
  selectedModelList: ModelConfigDto[];
  /** 将模型加入已选（左侧「添加」） */
  onToggleModel: (modelId: number) => void;
  /** 从已选移除（右侧「删除」） */
  onRemoveModel: (modelId: number) => void;
}

const ModelTabPanel: React.FC<ModelTabPanelProps> = ({
  modelLoading,
  modelList,
  selectedModelIds,
  selectedModelList,
  onToggleModel,
  onRemoveModel,
}) => (
  <div className={cx('flex', 'h-full')}>
    {/* 左侧：可选模型（纵向滚动） */}
    <div
      className={cx(
        'flex',
        'flex-col',
        'h-full',
        'flex-1',
        'overflow-y',
        styles.leftList,
      )}
    >
      {modelLoading && !modelList?.length ? (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Loading />
        </div>
      ) : (
        modelList?.map((item) => (
          <ResourceItem
            key={item.id}
            showIcon={false}
            name={item.name}
            description={item.description}
            targetId={item.id}
            onAdd={onToggleModel}
            isAdded={selectedModelIds.includes(item.id)}
          />
        ))
      )}
    </div>
    <div className={cx(styles.rightSeparator)} />
    {/* 右侧：已选模型 */}
    <div className={cx(styles.rightList, 'flex-1')}>
      {selectedModelList.length ? (
        selectedModelList.map((item) => (
          <ResourceItem
            key={item.id}
            showIcon={false}
            name={item.name}
            description={item.description}
            targetId={item.id}
            onDelete={onRemoveModel}
          />
        ))
      ) : (
        <div className={cx(styles.empty)}>暂无已选模型</div>
      )}
    </div>
  </div>
);

export default ModelTabPanel;
