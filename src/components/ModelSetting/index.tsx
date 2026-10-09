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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'umi';
import TooltipIcon from '../custom/TooltipIcon';
import './index.less';
import ModelListItem from './listItem/index';
import { ModelSettingProp } from './type';

/** 模型未配置或列表未命中时的默认 maxTokens 上限（仅用于滑块展示，不可用于钳位） */
const DEFAULT_MAX_TOKENS = 4093;

/** 精确 / 平衡 / 创意模式的默认回复长度（仍需被模型上限钳位） */
const PRESET_MAX_TOKENS = 1024;

/**
 * 滑块 + 数字输入的表单项
 * @param title 参数标题
 * @param configKey 绑定的表单字段
 * @param content 提示说明文案
 * @param min / max / step 滑块取值范围
 * @param form 节点表单实例
 */
interface ContentProps {
  title: string;
  configKey: 'maxTokens' | 'temperature' | 'topP';
  content: string;
  min: number;
  max: number;
  step: number;
  form: FormInstance;
}

/**
 * 从模型列表中解析当前模型真实的 maxTokens 上限
 * @returns 命中模型时返回上限；modelId 为空或未匹配时返回 null（禁止用默认值去钳位表单）
 */
const getMatchedModelMaxTokens = (
  modelList: ModelListItemProps[],
  modelId?: number | string | null,
): number | null => {
  if (modelId === null || modelId === undefined || modelId === '') {
    return null;
  }
  const matched = modelList.find((item) => Number(item.id) === Number(modelId));
  if (!matched?.maxTokens) {
    return null;
  }
  return matched.maxTokens;
};

/**
 * 仅当拿到「真实模型上限」且表单值越界时才钳位
 * 注意：Popover 初次挂载时 useWatch(modelId) 可能短暂为 undefined，
 * 此时绝不能用默认 4093 去把已保存的 maxTokens（如 10034）改掉
 */
const clampFormMaxTokens = (
  form: FormInstance,
  modelMaxTokens: number | null,
): void => {
  if (modelMaxTokens === null) {
    return;
  }
  const currentMaxTokens = form.getFieldValue('maxTokens');
  if (
    typeof currentMaxTokens === 'number' &&
    currentMaxTokens > modelMaxTokens
  ) {
    form.setFieldsValue({ maxTokens: modelMaxTokens });
  }
};

/**
 * 带分组的模型选择下拉框
 * 模型列表由父组件 ModelSelected 统一拉取并传入，避免与参数弹窗各自请求导致不同步
 */
export const GroupedOptionSelect: React.FC<ModelSettingProp> = ({
  form,
  modelConfig,
  modelList = [],
  groupedOptionsData = [],
  loading = false,
}) => {
  /**
   * 自定义渲染已选中模型的展示文案
   * 优先用当前列表；若列表尚未覆盖节点回填模型，则兜底 modelConfig
   */
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

  /**
   * 切换模型时：仅在匹配到新模型上限且当前值越界时钳位
   */
  const handleModelChange = (nextModelId: number) => {
    const modelMaxTokens = getMatchedModelMaxTokens(modelList, nextModelId);
    clampFormMaxTokens(form, modelMaxTokens);
  };

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
        onChange={handleModelChange}
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

/** 生成多样性预设：temperature / topP；maxTokens 在应用时再按模型上限钳位 */
const typeOptionValue = {
  Precision: {
    temperature: 0.1,
    topP: 0.7,
    maxTokens: PRESET_MAX_TOKENS,
  },
  Balanced: {
    temperature: 1.0,
    topP: 0.7,
    maxTokens: PRESET_MAX_TOKENS,
  },
  Creative: {
    temperature: 1.0,
    topP: 0.8,
    maxTokens: PRESET_MAX_TOKENS,
  },
};

/**
 * 参数滑块行
 * 使用本地 state 跟手拖拽；表单值变化（切换模型钳位等）再同步回来
 * 去掉随 max 变化的 key，避免拖拽过程中组件被重挂载导致「拖不动」
 */
const Content: React.FC<ContentProps> = ({
  title,
  configKey,
  content,
  min,
  max,
  step,
  form,
}) => {
  const watchedValue = Form.useWatch(configKey, form);
  // Popover 首帧 useWatch 可能仍是 undefined，必须用 getFieldValue 兜底
  const formValue =
    typeof watchedValue === 'number'
      ? watchedValue
      : form.getFieldValue(configKey);

  /** 将数值钳到 [min, max]，供展示与本地 state 使用 */
  const clampToRange = (value: number) => Math.min(Math.max(value, min), max);

  const [localValue, setLocalValue] = useState<number>(() =>
    typeof formValue === 'number' ? clampToRange(formValue) : min,
  );

  /**
   * 外部表单变更时同步本地（打开弹窗回显、模型切换钳位）
   * 拖拽过程中由 handleChange 直接改 localValue，保证跟手
   */
  useEffect(() => {
    if (typeof formValue === 'number') {
      setLocalValue(clampToRange(formValue));
    }
  }, [formValue, min, max]);

  const handleChange = (value: number | null) => {
    if (value === null) {
      return;
    }
    // 先更新本地，滑块立即跟手；再写入表单持久化
    setLocalValue(value);
    form.setFieldsValue({
      [configKey]: value,
      mode: 'Customization',
    });
  };

  return (
    <div className="dis-sb">
      <div className="dis-left label-style">
        <span className="mr-16">{title}</span>
        <TooltipIcon title={content} icon={<InfoCircleOutlined />} />
      </div>
      <div style={{ flex: 1 }}>
        <Flex gap="middle" align="center">
          <Slider
            min={min}
            max={max}
            className="slider-style"
            step={step}
            value={localValue}
            onChange={handleChange}
            style={{ width: 280 }}
          />
          <InputNumber
            min={min}
            max={max}
            step={step}
            size="small"
            style={{ margin: '0 16px' }}
            className="input-style"
            value={localValue}
            onChange={handleChange}
          />
        </Flex>
      </div>
    </div>
  );
};

/**
 * 模型参数设置弹窗（齿轮打开）
 * 打开时用已保存的 maxTokens 回显；滑块上限随当前模型动态变化
 */
export const ModelSetting: React.FC<ModelSettingProp> = ({
  form,
  modelList = [],
}) => {
  const [showMore, setShowMore] = useState(true);

  const mode = Form.useWatch('mode', form);
  const watchedModelId = Form.useWatch('modelId', form);
  // Popover 挂载首帧 useWatch(modelId) 经常是 undefined，必须立刻用 store 兜底
  const modelId =
    watchedModelId !== undefined && watchedModelId !== null
      ? watchedModelId
      : form.getFieldValue('modelId');

  /** 真实匹配上限；未匹配时为 null，禁止拿默认值去改表单 */
  const matchedMaxTokens = useMemo(
    () => getMatchedModelMaxTokens(modelList, modelId),
    [modelList, modelId],
  );

  /** 滑块 max：有匹配用匹配值，否则默认（只影响 UI 范围，不写回表单） */
  const currentMaxTokens = matchedMaxTokens ?? DEFAULT_MAX_TOKENS;

  /**
   * 仅在匹配到真实模型上限时钳位；跳过 useWatch 首帧空值，避免 10034 → 4093
   */
  useEffect(() => {
    clampFormMaxTokens(form, matchedMaxTokens);
  }, [form, matchedMaxTokens]);

  /**
   * 切换生成多样性预设
   * 预设自带的 maxTokens 需要再按当前模型上限钳位
   */
  const handleModeChange = (
    value: 'Precision' | 'Balanced' | 'Creative' | 'Customization',
  ) => {
    if (value !== 'Customization' && typeOptionValue[value]) {
      const { temperature, topP, maxTokens } = typeOptionValue[value];
      form.setFieldsValue({
        temperature,
        topP,
        maxTokens: Math.min(maxTokens, currentMaxTokens),
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
                value={mode}
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

/**
 * 工作流节点「模型」模块入口：下拉选择 + 齿轮参数弹窗
 * 统一拉取模型列表，保证切换模型后参数上限与列表数据同源
 */
export const ModelSelected: React.FC<ModelSettingProp> = ({
  form,
  modelConfig,
}) => {
  const [modelList, setModelList] = useState<ModelListItemProps[]>([]);
  const [groupedOptionsData, setGroupedOptionsData] = useState<
    GroupModelItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { spaceId } = useParams();

  /**
   * 拉取工作流可用的 Chat 模型列表，并按协议分组
   */
  const fetchModelList = useCallback(async () => {
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
      console.error('Failed to fetch model list:', error);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchModelList();
  }, [fetchModelList]);

  const watchedModelId = Form.useWatch('modelId', form);
  const modelId =
    watchedModelId !== undefined && watchedModelId !== null
      ? watchedModelId
      : form.getFieldValue('modelId');

  useEffect(() => {
    if (!modelList.length) {
      return;
    }
    const matchedMaxTokens = getMatchedModelMaxTokens(modelList, modelId);
    clampFormMaxTokens(form, matchedMaxTokens);
  }, [form, modelId, modelList]);

  return (
    <div className="node-item-style">
      <div className="dis-sb">
        <span className="node-title-style">
          {dict('PC.Components.ModelSetting.model')}
        </span>
        <Popover
          content={<ModelSetting form={form} modelList={modelList} />}
          trigger="click"
          placement="left"
        >
          <Button type="text" icon={<SettingOutlined />} size="small" />
        </Popover>
      </div>
      <GroupedOptionSelect
        form={form}
        modelConfig={modelConfig}
        modelList={modelList}
        groupedOptionsData={groupedOptionsData}
        loading={loading}
      />
    </div>
  );
};
