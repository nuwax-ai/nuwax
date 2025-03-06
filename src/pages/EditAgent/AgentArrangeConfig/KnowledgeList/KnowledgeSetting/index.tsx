import ConditionRender from '@/components/ConditionRender';
import LabelIcon from '@/components/LabelIcon';
import SliderNumber from '@/components/SliderNumber';
import {
  CALL_METHOD_OPTIONS,
  NO_RECALL_RESPONSE,
  SEARCH_STRATEGY_OPTIONS,
} from '@/constants/agent.constants';
import { apiAgentComponentKnowledgeUpdate } from '@/services/agentConfig';
import {
  InvokeTypeEnum,
  NoneRecallReplyTypeEnum,
  SearchStrategyEnum,
} from '@/types/enums/agent';
import type { KnowledgeBindConfig } from '@/types/interfaces/agent';
import type { KnowledgeSettingProps } from '@/types/interfaces/agentConfig';
import { Divider, Input, Modal, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 知识库设置
 */
const KnowledgeSetting: React.FC<KnowledgeSettingProps> = ({
  open,
  agentComponentInfo,
  onCancel,
}) => {
  // 绑定组件配置，不同组件配置不一样
  const [componentBindConfig, setComponentBindConfig] =
    useState<KnowledgeBindConfig>({
      invokeType: InvokeTypeEnum.AUTO,
      searchStrategy: SearchStrategyEnum.MIXED,
      maxRecallCount: 5,
      matchingDegree: 0.5,
      noneRecallReplyType: NoneRecallReplyTypeEnum.DEFAULT,
      noneRecallReply: '',
    });

  // 更新知识库组件配置
  const { run: runKnowledgeUpdate } = useRequest(
    apiAgentComponentKnowledgeUpdate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  useEffect(() => {
    if (agentComponentInfo?.bindConfig) {
      setComponentBindConfig(
        agentComponentInfo.bindConfig as KnowledgeBindConfig,
      );
    }
  }, [agentComponentInfo]);

  // 更新知识库组件配置
  const handleChangeKnowledge = (attr: string, value: React.Key) => {
    const bindConfig = {
      ...componentBindConfig,
      [attr]: value,
    };
    setComponentBindConfig(bindConfig);
    runKnowledgeUpdate({
      id: agentComponentInfo.id,
      targetId: agentComponentInfo.targetId,
      bindConfig,
    });
  };

  // 最大召回数change事件
  const handleMaxRecallNumber = (newValue: React.Key) => {
    if (Number.isNaN(newValue)) {
      return;
    }
    handleChangeKnowledge('maxRecallCount', newValue);
  };

  // 最小匹配度change事件
  const handleMinMatchDegree = (newValue: React.Key) => {
    if (Number.isNaN(newValue)) {
      return;
    }
    handleChangeKnowledge('matchingDegree', newValue);
  };

  return (
    <Modal title="知识库设置" open={open} footer={null} onCancel={onCancel}>
      <div className={cx(styles.container)}>
        <h3 className={cx(styles.title)}>召回</h3>
        {/*调用方式*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label="调用方式"
            title="选择是否每轮对话自动召回或按需从特定知识库召回"
          />
          <Radio.Group
            onChange={(e) =>
              handleChangeKnowledge('invokeType', e.target.value)
            }
            value={componentBindConfig.invokeType}
            options={CALL_METHOD_OPTIONS}
          />
        </div>
        {/*搜索策略*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label="搜索策略"
            title="从知识库中获取知识的检索方式,不同的检索策略可以更有效地找到正确的信息,提高其生成的答案的准确性和可用性。"
          />
          <Radio.Group
            onChange={(e) =>
              handleChangeKnowledge('searchStrategy', e.target.value)
            }
            value={componentBindConfig.searchStrategy}
            options={SEARCH_STRATEGY_OPTIONS}
          />
        </div>
        {/*最大召回数量*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label="最大召回数量"
            title="从知识库中返回给大模型的最大段落数,数值越大返回的内容越多"
          />
          <SliderNumber
            min={1}
            max={10}
            value={componentBindConfig.maxRecallCount.toString()}
            onChange={handleMaxRecallNumber}
          />
        </div>
        {/*最小匹配度*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label="最小匹配度"
            title="根据设置的匹配度选取段落返回给大模型,低于设定匹配度的内容不会被召回"
          />
          <SliderNumber
            min={0.01}
            max={0.99}
            step={0.01}
            value={componentBindConfig.matchingDegree.toString()}
            onChange={handleMinMatchDegree}
          />
        </div>
        <Divider />
        <h3 className={cx(styles.title)}>回复</h3>
        {/*无召回回复*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label="无召回回复"
            title="当知识库没有召回有效切片时的回复话术"
          />
          <Radio.Group
            onChange={(e) =>
              handleChangeKnowledge('noneRecallReplyType', e.target.value)
            }
            value={componentBindConfig.noneRecallReplyType}
            options={NO_RECALL_RESPONSE}
          />
        </div>
        <ConditionRender
          condition={
            componentBindConfig.noneRecallReplyType ===
            NoneRecallReplyTypeEnum.CUSTOM
          }
        >
          <Input.TextArea
            placeholder="请输入"
            value={componentBindConfig.noneRecallReply}
            onChange={(e) =>
              handleChangeKnowledge('noneRecallReply', e.target.value)
            }
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </ConditionRender>
      </div>
    </Modal>
  );
};

export default KnowledgeSetting;
