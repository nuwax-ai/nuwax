import { GENERATE_DIVERSITY_OPTIONS } from '@/constants/agent.constants';
import service from '@/services/workflow';
import type {
  GroupModelItem,
  ModelListItemProps,
} from '@/types/interfaces/model';
import { groupModelsByApiProtocol } from '@/utils/model';
import {
  CaretDownFilled,
  CaretUpFilled,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Divider, InputNumber, Popover, Radio, Select, Slider } from 'antd';
import { useEffect, useState } from 'react';
import './index.less';
import ModelListItem from './listItem/index';
import { GroupModelListItemProps, ModelSettingProp } from './type';

// 类型定义需要移到组件外部或使用内联类型
interface ContentProps {
  title: string;
  configKey: 'maxTokens' | 'temperature' | 'topP';
  content: string;
  min: number;
  max: number;
  step: number;
}

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
      onChange={(value: string) =>
        onChange({ ...nodeConfig, modelId: Number(value) })
      }
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

const typeOptionValue = {
  Precision: {
    temperature: 0.1,
    topP: 0.7,
    maxTokens: 1024,
  },
  Balanced: {
    temperature: 1.0,
    topP: 0.7,
    maxTokens: 1024,
  },
  Creative: {
    temperature: 1.0,
    topP: 0.8,
    maxTokens: 1024,
  },
};

// 定义模型的设置弹窗
export const ModelSetting: React.FC<ModelSettingProp> = ({
  nodeConfig,
  onChange,
}) => {
  const [showMore, setShowMore] = useState(true);
  // 切换显示更多的状态
  // 在组件顶部添加模式变更处理
  const handleModeChange = (mode: string) => {
    if (mode !== 'Customization') {
      // 当选择预设模式时应用对应配置
      onChange({
        ...nodeConfig,
        mode,
        ...typeOptionValue[mode as keyof typeof typeOptionValue],
      });
    } else {
      // 自定义模式保持当前值
      onChange({ ...nodeConfig, mode });
    }
  };
  // 修改滑块和输入框的更新逻辑
  const updateValue = (
    key: 'maxTokens' | 'temperature' | 'topP',
    val: number | null,
  ) => {
    const newConfig = {
      ...nodeConfig,
      mode: 'Customization', // 任何手动调整都切换为自定义模式
      [key]: val || 0,
    };
    onChange(newConfig);
  };

  const Content: React.FC<ContentProps> = ({
    title,
    configKey,
    content,
    min,
    max,
    step,
  }) => {
    return (
      <div className="dis-sb">
        <div className="dis-left label-style">
          <span className="mr-16">{title}</span>
          <Popover content={content} styles={{ body: { width: '300px' } }}>
            <InfoCircleOutlined />
          </Popover>
        </div>
        <Slider
          min={min}
          max={max}
          onChange={(val: number) => updateValue(configKey, val)}
          value={nodeConfig[configKey]}
          className="slider-style"
          step={step}
        />
        <InputNumber
          min={min}
          max={max}
          step={step}
          size="small"
          style={{ margin: '0 16px' }}
          value={nodeConfig[configKey]}
          onChange={(val: number | null) => updateValue(configKey, val)}
          className="input-style"
        />
      </div>
    );
  };
  return (
    <>
      <div className="model-dispose-mode-style">
        <div className="model-title-style border-bottom">模型</div>
        <div className="dis-sb margin-top-10">
          <span className="dispose-title-style">生成多样性</span>
          <div className="dis-left">
            <Radio.Group
              optionType="button"
              className="radio-button-style"
              options={GENERATE_DIVERSITY_OPTIONS}
              block
              value={nodeConfig.mode}
              onChange={(e) => handleModeChange(e.target.value)} // 改用新的处理函数
            ></Radio.Group>
            <div
              onClick={() => setShowMore(!showMore)}
              className="right-content-style"
            >
              <span>高级设置</span>
              {showMore ? <CaretUpFilled /> : <CaretDownFilled />}
            </div>
          </div>
        </div>
        {showMore && (
          <div>
            {/* temperature 参数配置 */}
            <Content
              min={0}
              max={1}
              step={0.1}
              title={'生成随机性'}
              configKey="temperature"
              content="temperature: 调高温度会使得模型的输出更多样性和创新性，反之，降低温度会使输出内容更加遵循指令要求但减少多样性。建议不要与 “Top p” 同时调整。"
            />
            {/* topP 参数配置 */}
            <Content
              min={0}
              max={1}
              step={0.1}
              title={'Top P'}
              configKey="topP"
              content="Top p 为累计概率: 模型在生成输出时会从概率最高的词汇开始选择，直到这些词汇的总概率累积达到 Top p 值。这样可以限制模型只选择这些高概率的词汇，从而控制输出内容的多样性。建议不要与 “生成随机性” 同时调整。"
            />
          </div>
        )}
        <Divider />
        <div className="dispose-title-style">输入及输出设置</div>
        <Content
          min={5}
          max={4093}
          step={1}
          title={'最大回复长度'}
          configKey="maxTokens"
          content="控制模型输出的 Tokens 长度上限。通常 100 Tokens 约等于 150 个中文汉字。"
        />
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
