import service from '@/services/workflow';
import type {
  GroupModelItem,
  ModelListItemProps,
} from '@/types/interfaces/model';
import { groupModelsByApiProtocol } from '@/utils/model';
import { SettingOutlined } from '@ant-design/icons';
import { InputNumber, Popover, Select, Slider } from 'antd';
import { useEffect, useState } from 'react';
import ModelListItem from './listItem/index';
import { GroupModelListItemProps, ModelSettingProp } from './type';
// 定义带图标的模型选择select
export const GroupedOptionSelect: React.FC<GroupModelListItemProps> = ({
  nodeConfig,
  onChange,
}) => {
  const [modelList, setModelList] = useState<ModelListItemProps[]>([]);
  const [groupedOptionsData, setGroupedOptionsData] = useState<
    GroupModelItem[]
  >([]);
  // 获取当前模型的列表数据
  const getModelList = async () => {
    try {
      // 调用接口，获取当前画布的所有节点和边
      const _res = await service.getModelListByWorkflowId({
        modelType: 'Chat',
      });
      // 将数据交给redux
      setModelList(_res.data);
      setGroupedOptionsData(groupModelsByApiProtocol(_res.data));
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    }
  };
  // 自定义渲染函数用于已选中的项
  const labelRender = (props: any) => {
    if (nodeConfig.modelId === null) return null;
    const _item = modelList.find((item) => item.id === Number(props.value));

    if (_item === undefined) return;
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* <img src={(_item as ModelListItemProps).icon} alt="" /> */}
        <span style={{ marginLeft: '8px' }}>
          {(_item as ModelListItemProps).name}
        </span>
      </div>
    );
  };

  useEffect(() => {
    getModelList();
  }, [nodeConfig.modelId]);
  return (
    <Select
      placeholder="请选择模型"
      style={{ width: '100%', marginTop: '10px' }}
      className="input-style"
      value={nodeConfig.modelId?.toString()}
      onChange={(value: string) => onChange({ ...nodeConfig, modelId: value })}
      labelRender={labelRender}
      placement={'bottomLeft'}
      popupMatchSelectWidth={false}
    >
      {groupedOptionsData?.map((group, groupIndex: number) => (
        <Select.OptGroup key={groupIndex} label={group.label}>
          {group.options.map((opt, index) => (
            <Select.Option
              key={`${groupIndex}-${index}`}
              value={opt.id}
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* 如果有 icon，可以在这里显示 */}
                  {opt.icon && (
                    <img
                      src={opt.icon}
                      alt=""
                      style={{
                        width: '20px',
                        height: '20px',
                        marginRight: '8px',
                      }}
                    />
                  )}
                  <span>{opt.name}</span>
                </div>
              }
            >
              <ModelListItem item={opt} />
            </Select.Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  );
};

// 定义模型的设置弹窗
export const ModelSetting: React.FC<ModelSettingProp> = ({
  nodeConfig,
  onChange,
}) => {
  // 更新值的辅助函数
  const updateValue = (
    key: 'maxTokens' | 'temperature' | 'topP',
    val: number | null,
  ) => {
    const newConfig = {
      ...nodeConfig,
      [key]: val || 0,
    };
    onChange(newConfig); // 将更新后的 nodeConfig 传递回父组件
  };

  return (
    <>
      <div className="model-dispose-mode-style">
        <div className="dis-sb">
          <span className="label-style">生成随机性</span>
          <Slider
            min={0}
            max={1}
            onChange={(val: number) => updateValue('temperature', val)}
            value={nodeConfig.temperature}
            className="slider-style"
          />
          <InputNumber
            min={0}
            max={1}
            size="small"
            style={{ margin: '0 16px' }}
            value={nodeConfig.temperature}
            onChange={(val: number | null) => updateValue('temperature', val)}
            className="input-style"
          />
        </div>
        <div className="dis-sb">
          <span className="label-style">top P</span>
          <Slider
            min={0}
            max={1}
            onChange={(val: number) => updateValue('topP', val)}
            value={nodeConfig.topP}
            className="slider-style"
          />
          <InputNumber
            min={0}
            max={1}
            style={{ margin: '0 16px' }}
            size="small"
            value={nodeConfig.topP}
            onChange={(val: number | null) => updateValue('topP', val)}
            className="input-style"
          />
        </div>
        <div className="dis-sb">
          <span className="label-style">最大回复长度</span>
          <Slider
            min={0}
            max={10000}
            onChange={(val: number) => updateValue('maxTokens', val)}
            value={nodeConfig.maxTokens}
            className="slider-style"
          />
          <InputNumber
            min={0}
            max={10000}
            size="small"
            style={{ margin: '0 16px' }}
            value={nodeConfig.maxTokens}
            onChange={(val: number | null) => updateValue('maxTokens', val)}
            className="input-style"
          />
        </div>
      </div>
    </>
  );
};

// 定义模型模块
export const ModelSelected: React.FC<ModelSettingProp> = ({
  nodeConfig,
  onChange,
  groupedOptionsData,
}) => {
  return (
    <div className="node-item-style">
      <div className="dis-sb">
        <span className="node-title-style">模型</span>
        <Popover
          content={<ModelSetting nodeConfig={nodeConfig} onChange={onChange} />}
          title="模型"
          trigger="click"
          placement="left"
        >
          <SettingOutlined />
        </Popover>
      </div>
      <GroupedOptionSelect
        groupedOptionsData={groupedOptionsData}
        onChange={onChange}
        nodeConfig={nodeConfig}
      />
    </div>
  );
};
