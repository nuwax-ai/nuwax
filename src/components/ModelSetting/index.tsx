import { dict } from '@/services/i18nRuntime';
import service from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ModelUsageScenarioEnum } from '@/types/enums/modelConfig';
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
import TooltipIcon from '../custom/TooltipIcon';
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

      const list = _res.data.filter((item) =>
        item.usageScenarios?.includes(
          AgentComponentTypeEnum.Workflow as unknown as ModelUsageScenarioEnum,
        ),
      );
      setModelList(list);
      setGroupedOptionsData(groupModelsByApiProtocol(list));
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
        placeholder={dict('PC.Components.ModelSetting.pleaseSelectModel')}
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
  {
    label: dict('PC.Components.ModelSetting.precisionMode'),
    value: 'Precision',
  },
  { label: dict('PC.Components.ModelSetting.balancedMode'), value: 'Balanced' },
  { label: dict('PC.Components.ModelSetting.creativeMode'), value: 'Creative' },
  {
    label: dict('PC.Components.ModelSetting.customMode'),
    value: 'Customization',
  },
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
        <TooltipIcon title={content} icon={<InfoCircleOutlined />} />
      </div>
      <Form.Item style={{ marginBottom: '0', flex: 1 }} noStyle>
        <Flex gap="middle" align="center">
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
          <Form.Item name={configKey} noStyle>
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
export const ModelSetting: React.FC<ModelSettingProp> = ({ form }) => {
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
  const [currentMaxTokens, setCurrentMaxTokens] = useState<number>(4093);
  const { spaceId } = useParams();
  useEffect(() => {
    const getModelList = async () => {
      const { modelId } = form.getFieldsValue(true);
      const _res = await service.getModelListByWorkflowId({
        modelType: 'Chat',
        spaceId,
      });
      setCurrentMaxTokens(
        _res.data.find((item) => item.id === modelId)?.maxTokens || 4093,
      );
    };
    getModelList();
  }, []);

  return (
    <>
      <div className="model-dispose-mode-style">
        <div className="model-title-style border-bottom">
          {dict('PC.Components.ModelSetting.model')}
        </div>
        <div className="dis-sb margin-top-10">
          <span className="dispose-title-style">
            {dict('PC.Components.ModelSetting.generateDiversity')}
          </span>
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
              <span>{dict('PC.Components.ModelSetting.advancedSettings')}</span>
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
            title={dict('PC.Components.ModelSetting.generateRandomness')}
            configKey="temperature"
            content={dict('PC.Components.ModelSetting.temperatureDesc')}
          />
          <Content
            form={form}
            min={0}
            max={1}
            step={0.1}
            title={'Top P'}
            configKey="topP"
            content={dict('PC.Components.ModelSetting.topPDesc')}
          />
        </div>
        <Divider />
        <div className="dispose-title-style">
          {dict('PC.Components.ModelSetting.inputOutputSettings')}
        </div>
        <Content
          form={form}
          min={5}
          max={currentMaxTokens}
          step={1}
          title={dict('PC.Components.ModelSetting.maxReplyLength')}
          configKey="maxTokens"
          content={dict('PC.Components.ModelSetting.maxTokensDesc')}
        />
      </div>
    </>
  );
};

// 定义模型模块
export const ModelSelected: React.FC<ModelSettingProp> = ({
  form,
  modelConfig,
}) => {
  return (
    <div className="node-item-style">
      <div className="dis-sb">
        <span className="node-title-style">
          {dict('PC.Components.ModelSetting.model')}
        </span>
        <Popover
          content={<ModelSetting form={form} />}
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
