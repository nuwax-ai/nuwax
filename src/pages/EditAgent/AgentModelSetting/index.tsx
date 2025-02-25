import LabelIcon from '@/components/LabelIcon';
import SelectList from '@/components/SelectList';
import SliderNumber from '@/components/SliderNumber';
import { apiAgentComponentModelUpdate } from '@/services/agentConfig';
import { apiModelList } from '@/services/modelConfig';
import { UpdateModeComponentEnum } from '@/types/enums/library';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import { AgentComponentInfo } from '@/types/interfaces/agent';
import { option } from '@/types/interfaces/common';
import type { ModelConfigInfo } from '@/types/interfaces/model';
import { InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { Form, InputNumberProps, Modal, Segmented } from 'antd';
import classnames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classnames.bind(styles);

interface AgentModelSettingProps {
  id: number;
  spaceId: number;
  modelComponentConfig: AgentComponentInfo;
  open: boolean;
  onCancel: () => void;
}

/**
 * 智能体模型设置组件，待核实交互逻辑以及内容
 */
const AgentModelSetting: React.FC<AgentModelSettingProps> = ({
  id,
  spaceId,
  modelComponentConfig,
  open,
  onCancel,
}) => {
  const [mode, setMode] = useState<UpdateModeComponentEnum>(
    UpdateModeComponentEnum.Precision,
  );
  const [targetId, setTargetId] = useState<number>(
    modelComponentConfig?.targetId || 0,
  );
  const [temperature, setTemperature] = useState<string>('1');
  const [topP, setTopP] = useState<string>('0.7');
  const [maxTokens, setMaxTokens] = useState<string>('100');
  const [contextRounds, setContextRounds] = useState<string>('1024');
  const [modelConfigList, setModelConfig] = useState<option[]>([]);

  // 查询可使用模型列表接口
  const { run: runMode } = useRequest(apiModelList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: ModelConfigInfo[]) => {
      console.log(result, '------');
      const list = result?.map((item) => ({
        label: item.model,
        value: item.id,
      })) as option[];
      setModelConfig(list);
    },
  });

  // 更新模型组件配置
  const { run } = useRequest(apiAgentComponentModelUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {},
  });

  console.log(modelComponentConfig, 'modelComponentConfig');

  useEffect(() => {
    runMode({
      spaceId,
      modelType: ModelTypeEnum.Chat,
    });
  }, [spaceId]);

  useEffect(() => {
    run({
      id,
      bindConfig: {
        mode,
        temperature,
        topP,
        maxTokens,
        contextRounds,
      },
    });
  }, [mode, temperature, topP, maxTokens, contextRounds]);

  const handleChangeMode = (value) => {
    setMode(value);
  };

  const handleChangeTemp: InputNumberProps['onChange'] = (newValue) => {
    setTemperature(newValue);
  };

  const handleChangeTopP = (value: string) => {
    setTopP(value);
  };

  const handleChangeMaxTokens = (value: string) => {
    setMaxTokens(value);
  };

  const handleChangeContextRounds = (value: string) => {
    setContextRounds(value);
  };

  const handleChangeModel = (id: number) => {
    setTargetId(id);
  };

  return (
    <Modal title="模型设置" open={open} footer={null} onCancel={onCancel}>
      <Form layout="vertical">
        <Form.Item name="model" label="模型">
          <SelectList
            onChange={handleChangeModel}
            options={modelConfigList}
            value={targetId}
          />
        </Form.Item>
      </Form>
      <h3 className={cx(styles.title)}>
        生成多样性
        <InfoCircleOutlined />
      </h3>
      <Segmented<string>
        options={[
          { label: '精确模式', value: UpdateModeComponentEnum.Precision },
          { label: '平衡模式', value: UpdateModeComponentEnum.Balanced },
          { label: '创意模式', value: UpdateModeComponentEnum.Creative },
          { label: '自定义', value: UpdateModeComponentEnum.Customization },
        ]}
        onChange={handleChangeMode}
        block
      />
      <div
        className={cx(
          'flex',
          'content-end',
          'items-center',
          styles['high-box'],
        )}
      >
        <span>
          高级设置 <UpOutlined />
        </span>
      </div>
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon label="生成随机性" title="" />
        <SliderNumber
          min={1}
          max={10}
          value={temperature}
          onChange={handleChangeTemp}
        />
      </div>
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon label="Top p" title="" />
        <SliderNumber
          min={0.1}
          max={1}
          step={0.1}
          value={topP}
          onChange={handleChangeTopP}
        />
      </div>
      <h3 className={cx(styles.title)}>输入及输出设置</h3>
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon label="携带上下文轮数" title="" />
        <SliderNumber
          min={1}
          max={100}
          step={1}
          value={maxTokens}
          onChange={handleChangeMaxTokens}
        />
      </div>
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon label="最大回复长度" title="" />
        <SliderNumber
          min={100}
          max={1024}
          step={1}
          value={contextRounds}
          onChange={handleChangeContextRounds}
        />
      </div>
      <div className={cx('flex', 'mb-16')}>
        <LabelIcon label="输出格式" title="" />
        <SelectList
          style={{ width: '100%' }}
          onChange={() => {}}
          options={[]}
          value={1}
        />
      </div>
    </Modal>
  );
};

export default AgentModelSetting;
