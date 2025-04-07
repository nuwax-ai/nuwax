import LabelIcon from '@/components/LabelIcon';
import SelectList from '@/components/SelectList';
import SliderNumber from '@/components/SliderNumber';
import {
  GENERATE_DIVERSITY_OPTION_VALUE,
  GENERATE_DIVERSITY_OPTIONS,
} from '@/constants/agent.constants';
import { apiAgentComponentModelUpdate } from '@/services/agentConfig';
import { apiModelList } from '@/services/modelConfig';
import { UpdateModeComponentEnum } from '@/types/enums/library';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import type { ComponentModelBindConfig } from '@/types/interfaces/agent';
import type { AgentModelSettingProps } from '@/types/interfaces/agentConfig';
import { option } from '@/types/interfaces/common';
import type { ModelConfigInfo } from '@/types/interfaces/model';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Modal, Segmented } from 'antd';
import classnames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classnames.bind(styles);

/**
 * 智能体模型设置组件，待核实交互逻辑以及内容
 */
const AgentModelSetting: React.FC<AgentModelSettingProps> = ({
  spaceId,
  modelComponentConfig,
  open,
  onCancel,
  onSelectMode,
}) => {
  const [targetId, setTargetId] = useState<number>(0);
  // 模型列表
  const [modelConfigList, setModelConfig] = useState<option[]>([]);
  // 绑定组件配置，不同组件配置不一样
  const [componentBindConfig, setComponentBindConfig] =
    useState<ComponentModelBindConfig>({
      // 上下文轮数
      contextRounds: 0,
      // 最大生成长度
      maxTokens: 0,
      mode: UpdateModeComponentEnum.Precision,
      // 生成随机性;0-1
      temperature: 0,
      // 累计概率: 模型在生成输出时会从概率最高的词汇开始选择;0-1
      topP: 0,
    });
  const componentIdRef = useRef<number>(0);

  // 查询可使用模型列表接口
  const { run: runMode } = useRequest(apiModelList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ModelConfigInfo[]) => {
      const list: option[] =
        result?.map((item) => ({
          label: item.name,
          value: item.id,
        })) || [];
      setModelConfig(list);
    },
  });

  // 更新模型组件配置
  const { run: runUpdate } = useRequest(apiAgentComponentModelUpdate, {
    manual: true,
    debounceInterval: 1000,
  });

  useEffect(() => {
    if (modelComponentConfig) {
      componentIdRef.current = modelComponentConfig.id;
      setComponentBindConfig(
        modelComponentConfig.bindConfig as ComponentModelBindConfig,
      );
      setTargetId(modelComponentConfig.targetId);
    }
  }, [modelComponentConfig]);

  useEffect(() => {
    // 查询可使用模型列表接口
    runMode({
      spaceId,
      modelType: ModelTypeEnum.Chat,
    });
  }, [spaceId]);

  // 更新模型配置
  const handleChangeModel = (
    bindConfig: ComponentModelBindConfig,
    _targetId = targetId,
  ) => {
    runUpdate({
      id: componentIdRef.current,
      targetId: _targetId,
      bindConfig,
    });
  };

  // 下拉模型
  const handleChangeModelTarget = (id: number) => {
    setTargetId(id);
    handleChangeModel(componentBindConfig, id);
    // 更新智能体 - 绑定的模型名称
    const { value, label } = modelConfigList?.find((item) => item.value === id);
    onSelectMode(value, label);
  };

  // 生成多样性
  const handleChangeGenerateDiversity = (newValue: UpdateModeComponentEnum) => {
    let _componentBindConfig: ComponentModelBindConfig;
    // 自定义
    if (newValue === UpdateModeComponentEnum.Customization) {
      _componentBindConfig = {
        ...componentBindConfig,
        mode: newValue,
      };
    } else {
      // 默认值
      _componentBindConfig = {
        ...GENERATE_DIVERSITY_OPTION_VALUE[newValue],
        mode: newValue,
      };
    }

    setComponentBindConfig(_componentBindConfig);
    handleChangeModel(_componentBindConfig);
  };

  // 更新模型组件配置
  const handleChange = (newValue: React.Key, attr: string) => {
    const _componentBindConfig: ComponentModelBindConfig = {
      ...componentBindConfig,
      [attr]: Number(newValue),
      mode: UpdateModeComponentEnum.Customization,
    };
    setComponentBindConfig(_componentBindConfig);
    handleChangeModel(_componentBindConfig);
  };

  return (
    <Modal
      title="模型设置"
      classNames={{
        content: cx(styles['modal-wrapper']),
      }}
      open={open}
      footer={null}
      onCancel={onCancel}
    >
      <h3 className={cx(styles.title)}>模型</h3>
      <div>
        <SelectList
          className={cx(styles.select)}
          onChange={handleChangeModelTarget}
          options={modelConfigList}
          value={targetId}
        />
      </div>
      <h3 className={cx(styles.title)}>
        生成多样性
        <InfoCircleOutlined />
      </h3>
      <Segmented<UpdateModeComponentEnum>
        options={GENERATE_DIVERSITY_OPTIONS}
        rootClassName={cx('mb-16')}
        value={componentBindConfig?.mode}
        onChange={handleChangeGenerateDiversity}
        block
      />
      {/*生成随机性;0-1*/}
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon
          label="生成随机性"
          title="temperature: 调高温度会使得模型的输出更多样性和创新性，反之，降低温度会使输出内容更加遵循指令要求但减少多样性。建议不要与 “Top p” 同时调整"
        />
        <SliderNumber
          min={0}
          max={1}
          step={0.1}
          value={componentBindConfig?.temperature as string}
          onChange={(value) => handleChange(value, 'temperature')}
        />
      </div>
      {/*累计概率: 模型在生成输出时会从概率最高的词汇开始选择;0-1*/}
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon
          label="Top p"
          title="Top p 为累计概率: 模型在生成输出时会从概率最高的词汇开始选择，直到这些词汇的总概率累积达到 Top p 值。这样可以限制模型只选择这些高概率的词汇，从而控制输出内容的多样性。建议不要与 “生成随机性” 同时调整。"
        />
        <SliderNumber
          min={0}
          max={1}
          step={0.1}
          value={componentBindConfig?.topP as string}
          onChange={(value) => handleChange(value, 'topP')}
        />
      </div>
      <h3 className={cx(styles.title)}>输入及输出设置</h3>
      {/*上下文轮数*/}
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon
          label="携带上下文轮数"
          title="设置带入模型上下文的对话历史轮数。轮数越多，多轮对话的相关性越高，但消耗的 Token 也越多"
        />
        <SliderNumber
          min={0}
          max={100}
          step={1}
          value={componentBindConfig?.contextRounds as string}
          onChange={(value) => handleChange(value, 'contextRounds')}
        />
      </div>
      {/*最大生成长度*/}
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon
          label="最大回复长度"
          title="控制模型输出的 Tokens 长度上限。通常 100 Tokens 约等于 150 个中文汉字。"
        />
        <SliderNumber
          min={1}
          max={4096}
          step={1}
          value={componentBindConfig?.maxTokens as string}
          onChange={(value) => handleChange(value, 'maxTokens')}
        />
      </div>
    </Modal>
  );
};

export default AgentModelSetting;
