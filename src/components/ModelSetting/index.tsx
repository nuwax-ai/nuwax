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
import type { FormInstance } from 'antd';
import {
  Button,
  Divider,
  Flex,
  Form,
  InputNumber,
  Popover,
  Radio,
  Select,
  Slider,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'umi';
import './index.less';
import ModelListItem from './listItem/index';
import { ModelSettingProp } from './type';

// 类型定义需要移到组件外部或使用内联类型
interface ContentProps {
  title: string;
  configKey: 'maxTokens' | 'temperature' | 'topP';
  content: string;
  min: number;
  max: number;
  step: number;
  form: FormInstance;
}

// 定义带图标的模型选择select
export const GroupedOptionSelect: React.FC<ModelSettingProp> = ({
  form,
  modelConfig,
}) => {
  const [modelList, setModelList] = useState<ModelListItemProps[]>([]);
  const [groupedOptionsData, setGroupedOptionsData] = useState<
    GroupModelItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { spaceId } = useParams();
  // 获取当前模型的列表数据
  const getModelList = async () => {
    try {
      setLoading(true);
      const _res = await service.getModelListByWorkflowId({
        modelType: 'Chat',
        spaceId,
      });
      setModelList(_res.data);
      setGroupedOptionsData(groupModelsByApiProtocol(_res.data));
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自定义渲染函数用于已选中的项
  const labelRender = (props: any) => {
    if (form.getFieldValue('modelId') === null) return null;
    const _item = [
      ...modelList,
      modelConfig?.id !== undefined
        ? { id: modelConfig?.id, name: modelConfig?.name }
        : {},
    ].find((item) => item.id === Number(props.value));
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span>{(_item && (_item as ModelListItemProps).name) || ''}</span>
      </div>
    );
  };

  useEffect(() => {
    getModelList();
  }, []);

  return (
    <Form.Item name={'modelId'}>
      <Select
        placeholder="请选择模型"
        style={{ width: '100%', marginTop: '10px' }}
        className="input-style"
        labelRender={labelRender}
        placement={'bottomLeft'}
        popupMatchSelectWidth={false}
        loading={loading}
      >
        {groupedOptionsData?.map((group, groupIndex: number) => {
          return (
            <React.Fragment key={`model-options-${groupIndex}`}>
              {group.options.map((opt, index) => (
                <Select.Option
                  key={`${groupIndex}-${index}`}
                  value={opt.id}
                  label={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
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
            </React.Fragment>
          );
        })}
      </Select>
    </Form.Item>
  );
};

const options = [
  { label: '精确模式', value: 'Precision' },
  { label: '平衡模式', value: 'Balanced' },
  { label: '创意模式', value: 'Creative' },
  { label: '自定义', value: 'Customization' },
];

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

const Content: React.FC<ContentProps> = ({
  title,
  configKey,
  content,
  min,
  max,
  step,
  form,
}) => {
  const handleChange = (value: number | null) => {
    if (value !== null) {
      form.setFieldsValue({
        [configKey]: value,
        mode: 'Customization',
      });
    }
  };

  return (
    <div className="dis-sb">
      <div className="dis-left label-style">
        <span className="mr-16">{title}</span>
        <Popover content={content}>
          <InfoCircleOutlined />
        </Popover>
      </div>
      <Form.Item style={{ marginBottom: '0', flex: 1 }} noStyle>
        <Flex gap="middle">
          <Form.Item name={configKey} noStyle>
            <Slider
              min={min}
              max={max}
              className="slider-style"
              step={step}
              value={form.getFieldValue(configKey)}
              onChange={handleChange}
              style={{ width: 280 }}
            />
          </Form.Item>
          <Form.Item name={configKey}>
            <InputNumber
              min={min}
              max={max}
              step={step}
              size="small"
              style={{ margin: '0 16px' }}
              className="input-style"
              value={form.getFieldValue(configKey)}
              onChange={handleChange}
            />
          </Form.Item>
        </Flex>
      </Form.Item>
    </div>
  );
};

// 定义模型的设置弹窗
export const ModelSetting: React.FC<ModelSettingProp> = ({
  form,
  maxTokensLimit = 4093,
}) => {
  const [showMore, setShowMore] = useState(true);

  // 使用useWatch监听mode变化
  const mode = Form.useWatch('mode', form);

  // 处理模式切换
  const handleModeChange = (
    value: 'Precision' | 'Balanced' | 'Creative' | 'Customization',
  ) => {
    if (value !== 'Customization' && typeOptionValue[value]) {
      const { temperature, topP, maxTokens } = typeOptionValue[value];
      form.setFieldsValue({
        temperature,
        topP,
        maxTokens,
        mode: value,
      });
    } else {
      form.setFieldsValue({
        mode: 'Customization',
      });
    }
  };

  return (
    <>
      <div className="model-dispose-mode-style">
        <div className="model-title-style border-bottom">模型</div>
        <div className="dis-sb margin-top-10">
          <span className="dispose-title-style">生成多样性</span>
          <div className="dis-left">
            <Form.Item name={'mode'} style={{ marginBottom: 0 }}>
              <Radio.Group
                optionType="button"
                className="radio-button-style"
                options={options}
                onChange={(e) => handleModeChange(e.target.value)}
                value={mode} // 添加value绑定
                block
              ></Radio.Group>
            </Form.Item>
            <div
              onClick={() => setShowMore(!showMore)}
              className="right-content-style"
            >
              <span>高级设置</span>
              {showMore ? <CaretUpFilled /> : <CaretDownFilled />}
            </div>
          </div>
        </div>
        <div style={{ display: showMore ? 'block' : 'none' }}>
          <Content
            form={form}
            min={0}
            max={1}
            step={0.1}
            title={'生成随机性'}
            configKey="temperature"
            content="temperature: 调高温度会使得模型的输出更多样性和创新性，反之，降低温度会使输出内容更加遵循指令要求但减少多样性。建议不要与 'Top p' 同时调整。"
          />
          <Content
            form={form}
            min={0}
            max={1}
            step={0.1}
            title={'Top P'}
            configKey="topP"
            content="Top p 为累计概率: 模型在生成输出时会从概率最高的词汇开始选择，直到这些词汇的总概率累积达到 Top p 值。这样可以限制模型只选择这些高概率的词汇，从而控制输出内容的多样性。建议不要与 '生成随机性' 同时调整。"
          />
        </div>
        <Divider />
        <div className="dispose-title-style">输入及输出设置</div>
        <Content
          form={form}
          min={5}
          max={maxTokensLimit}
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
  form,
  maxTokensLimit,
  modelConfig,
}) => {
  return (
    <div className="node-item-style">
      <div className="dis-sb">
        <span className="node-title-style">模型</span>
        <Popover
          content={<ModelSetting form={form} maxTokensLimit={maxTokensLimit} />}
          trigger="click"
          placement="left"
        >
          <Button type="text" icon={<SettingOutlined />} size="small" />
        </Popover>
      </div>
      <GroupedOptionSelect form={form} modelConfig={modelConfig} />
    </div>
  );
};
