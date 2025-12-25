import LabelIcon from '@/components/LabelIcon';
import SliderNumber from '@/components/SliderNumber';
import SelectList from '@/components/custom/SelectList';
import TooltipIcon from '@/components/custom/TooltipIcon';
import {
  GENERATE_DIVERSITY_OPTION_VALUE,
  GENERATE_DIVERSITY_OPTIONS,
} from '@/constants/agent.constants';
import { apiAgentComponentModelUpdate } from '@/services/agentConfig';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import { UpdateModeComponentEnum } from '@/types/enums/library';
import { ModelApiProtocolEnum } from '@/types/enums/modelConfig';
import { AgentTypeEnum } from '@/types/enums/space';
import type { ComponentModelBindConfig } from '@/types/interfaces/agent';
import type { AgentModelSettingProps } from '@/types/interfaces/agentConfig';
import { option } from '@/types/interfaces/common';
import type { ModelConfigInfo } from '@/types/interfaces/model';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Modal, Segmented } from 'antd';
import classnames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classnames.bind(styles);

/**
 * 智能体模型设置组件，待核实交互逻辑以及内容
 */
const AgentModelSetting: React.FC<
  {
    originalModelConfigList?: ModelConfigInfo[];
  } & AgentModelSettingProps
> = ({
  originalModelConfigList = [],
  agentConfigInfo,
  modelComponentConfig,
  devConversationId,
  open,
  onCancel,
}) => {
  const [targetId, setTargetId] = useState<number | null>(null);
  // 模型列表
  const [modelConfigList, setModelConfigList] = useState<option[]>([]);
  // 原始模型列表
  // const [originalModelConfigList, setOriginalModelConfigList] = useState<ModelConfigInfo[]>([]);
  // 模型列表缓存
  // const modelConfigListRef = useRef<ModelConfigInfo[]>([]);
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
      // 推理模型ID
      reasoningModelId: null,
    });
  const componentIdRef = useRef<number>(0);
  const { runQueryConversation } = useModel('conversationInfo');

  // 查询可使用模型列表接口
  // const { run: runMode } = useRequest(apiModelList, {
  //   manual: true,
  //   debounceInterval: 300,
  //   onSuccess: (result: ModelConfigInfo[]) => {
  //     modelConfigListRef.current = result;
  //     setOriginalModelConfigList(result);

  //   },
  // });

  useEffect(() => {
    if (originalModelConfigList?.length && agentConfigInfo) {
      if (agentConfigInfo?.type === AgentTypeEnum.TaskAgent) {
        const list: option[] =
          originalModelConfigList
            ?.filter(
              (item) => item.apiProtocol === ModelApiProtocolEnum.Anthropic, // 只能使用Anthropic模型
            )
            ?.map((item) => ({
              label: item.name,
              value: item.id,
            })) || [];
        setModelConfigList(list);
      } else {
        const list: option[] =
          originalModelConfigList?.map((item) => ({
            label: item.name,
            value: item.id,
          })) || [];
        setModelConfigList(list);
      }
    }
  }, [originalModelConfigList, agentConfigInfo]);

  useEffect(() => {
    if (open && modelComponentConfig) {
      componentIdRef.current = modelComponentConfig.id;
      setComponentBindConfig(
        modelComponentConfig.bindConfig as ComponentModelBindConfig,
      );

      // 任务智能体，需要根据任务智能体配置的模型类型，查询可使用模型列表接口
      if (agentConfigInfo?.type === AgentTypeEnum.TaskAgent) {
        const targetId = modelComponentConfig.targetId;
        const targetModelInfo = modelConfigList?.find(
          (item) => item.value === targetId,
        );
        if (targetModelInfo) {
          setTargetId(modelComponentConfig.targetId);
        } else {
          setTargetId(null);
        }
      } else {
        setTargetId(modelComponentConfig.targetId);
      }
    }
  }, [open, modelComponentConfig]);

  // useEffect(() => {
  //   // 查询可使用模型列表接口
  //   runMode({
  //     spaceId,
  //     modelType: ModelTypeEnum.Chat,
  //   });
  // }, [spaceId]);

  // 推理模型列表
  const reasonModelList: option[] = useMemo(() => {
    return (
      originalModelConfigList
        ?.filter((item) => item.isReasonModel === 1 && item.id !== targetId)
        ?.map((item) => ({
          label: item.name,
          value: item.id,
        })) || []
    );
  }, [originalModelConfigList, targetId]);

  // 当前模型信息
  const currentModelInfo = useMemo(() => {
    return originalModelConfigList?.find((item) => item.id === targetId);
  }, [originalModelConfigList, targetId]);

  // 更新模型配置
  const handleChangeModel = async (
    bindConfig: ComponentModelBindConfig,
    _targetId = targetId,
  ) => {
    await apiAgentComponentModelUpdate({
      id: componentIdRef.current,
      targetId: _targetId,
      bindConfig,
    });
  };

  // 下拉模型
  const handleChangeModelTarget = (id: React.Key) => {
    const _id = Number(id);
    setTargetId(_id);
    const _currentModelInfo = originalModelConfigList?.find(
      (item) => item.id === _id,
    );
    let _componentBindConfig = { ...componentBindConfig };
    // 如果当前模型的最大生成长度小于组件的最大生成长度，需要重置最大生成长度
    if (
      _currentModelInfo &&
      _currentModelInfo.maxTokens < _componentBindConfig.maxTokens
    ) {
      _componentBindConfig = {
        ..._componentBindConfig,
        maxTokens: _currentModelInfo.maxTokens,
      };
    }
    // 如果当前模型是推理模型，需要重置推理模型ID，并且设置推理模型ID为null， 因为会话模型和推理模型如果相同，没意义
    if (_id === componentBindConfig.reasoningModelId) {
      _componentBindConfig = {
        ..._componentBindConfig,
        reasoningModelId: null,
      };
    }
    setComponentBindConfig(_componentBindConfig);
    // 更新模型配置
    handleChangeModel(_componentBindConfig, _id);
  };

  // 生成多样性
  const handleChangeGenerateDiversity = (newValue: UpdateModeComponentEnum) => {
    const _componentBindConfig: ComponentModelBindConfig = {
      ...componentBindConfig,
      ...(newValue !== UpdateModeComponentEnum.Customization // 非自定义，使用默认值
        ? GENERATE_DIVERSITY_OPTION_VALUE[newValue]
        : {}),
      mode: newValue,
    };

    setComponentBindConfig(_componentBindConfig);
    handleChangeModel(_componentBindConfig);
  };

  // 更新模型组件配置
  const handleChange = async (newValue: React.Key, attr: string) => {
    let _value;
    // 切换推理模型
    if (attr === 'reasoningModelId') {
      _value = Number(newValue) || null;
    } else {
      _value = Number(newValue) || 0;
    }
    const _componentBindConfig: ComponentModelBindConfig = {
      ...componentBindConfig,
      [attr]: _value,
      mode: UpdateModeComponentEnum.Customization,
    };
    setComponentBindConfig(_componentBindConfig);
    await handleChangeModel(_componentBindConfig);
    // 更新已选择的推理模型信息，用于在关闭弹窗时，同步更新会话输入框中的推理模型 - 绑定的模型名称
    if (attr === 'reasoningModelId' && devConversationId) {
      runQueryConversation(devConversationId);
    }
  };

  // 关闭按钮
  const handleCancel = () => {
    // 更新智能体 - 绑定的模型名称
    const info = modelConfigList?.find((item) => item.value === targetId);
    const name = String(info?.label) || '';
    onCancel(targetId, name, componentBindConfig);
  };
  if (agentConfigInfo?.type === AgentTypeEnum.TaskAgent) {
    return (
      <Modal
        title="模型设置"
        classNames={{
          content: cx(styles['modal-wrapper']),
        }}
        open={open}
        footer={null}
        onCancel={handleCancel}
      >
        <Flex gap={20}>
          <div className="flex-1">
            <h3 className={cx(styles.title)}>会话模型</h3>
            <SelectList
              placeholder="请选择会话模型"
              className={cx(styles.select)}
              onChange={handleChangeModelTarget}
              options={modelConfigList}
              value={targetId}
            />
          </div>
        </Flex>
        <br />
      </Modal>
    );
  }

  return (
    <Modal
      title="模型设置"
      classNames={{
        content: cx(styles['modal-wrapper']),
      }}
      open={open}
      footer={null}
      onCancel={handleCancel}
    >
      <Flex gap={20}>
        <div className="flex-1">
          <h3 className={cx(styles.title)}>会话模型</h3>
          <SelectList
            placeholder="请选择会话模型"
            className={cx(styles.select)}
            onChange={handleChangeModelTarget}
            options={modelConfigList}
            value={targetId}
          />
        </div>
        <div className="flex-1">
          <h3 className={cx(styles.title)}>推理模型(可选)</h3>
          <SelectList
            placeholder="请选择推理模型"
            className={cx(styles.select)}
            onChange={(value) => handleChange(value, 'reasoningModelId')}
            options={reasonModelList}
            value={componentBindConfig.reasoningModelId}
            allowClear
          />
        </div>
      </Flex>
      <h3 className={cx(styles.title, 'flex', 'items-center')}>
        生成多样性
        <TooltipIcon
          title={
            <>
              <h4 className={cx(styles['generate-name'])}>精确模式:</h4>
              <p>严格遵循指令生成内容</p>
              <p>适用于需准确无误的场合，如正式文档、代码等</p>
              <h4 className={cx(styles['generate-name'])}>平衡模式:</h4>
              <p>在创新和精确之间寻求平衡</p>
              <p>适用于大多数日常应用场景，生成有趣但不失严谨的内容</p>
              <h4 className={cx(styles['generate-name'])}>创意模式:</h4>
              <p>激发创意，提供新颖独特的想法</p>
              <p>适合需要灵感和独特观点的场景，如头脑风暴、创意写作等</p>
              <h4 className={cx(styles['generate-name'])}>自定义模式:</h4>
              <p>通过高级设置，自定义生成方式</p>
              <p>根据需求，进行精细调整，实现个性化优化</p>
            </>
          }
          icon={<InfoCircleOutlined />}
          type={TooltipTitleTypeEnum.White}
        />
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
          value={String(componentBindConfig?.temperature) || '0'}
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
          value={String(componentBindConfig?.topP) || '0'}
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
          value={String(componentBindConfig?.contextRounds) || '0'}
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
          max={currentModelInfo?.maxTokens || 4096}
          step={1}
          value={String(componentBindConfig?.maxTokens) || '0'}
          onChange={(value) => handleChange(value, 'maxTokens')}
        />
      </div>
    </Modal>
  );
};

export default AgentModelSetting;
