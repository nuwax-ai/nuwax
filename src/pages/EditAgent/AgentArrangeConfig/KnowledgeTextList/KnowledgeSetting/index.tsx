import ConditionRender from '@/components/ConditionRender';
import LabelIcon from '@/components/LabelIcon';
import SliderNumber from '@/components/SliderNumber';
import { apiAgentComponentKnowledgeUpdate } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import {
  InvokeTypeEnum,
  NoneRecallReplyTypeEnum,
  SearchStrategyEnum,
} from '@/types/enums/agent';
import type {
  AgentComponentInfo,
  KnowledgeBindConfig,
} from '@/types/interfaces/agent';
import type { KnowledgeSettingProps } from '@/types/interfaces/agentConfig';
import { Divider, Input, Modal, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel, useRequest } from 'umi';
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
  const { agentComponentList, setAgentComponentList } = useModel('spaceAgent');

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
      debounceInterval: 300,
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
    if (attr === 'invokeType') {
      const _newList = agentComponentList.map((item: AgentComponentInfo) => {
        if (item.id === agentComponentInfo?.id) {
          item.bindConfig['invokeType'] = value;
        }
        return item;
      });
      setAgentComponentList(_newList);
    }
    runKnowledgeUpdate({
      id: agentComponentInfo?.id,
      targetId: agentComponentInfo?.targetId,
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

  const invokeTypeOptions = useMemo(
    () => [
      {
        value: InvokeTypeEnum.AUTO,
        label: t('PC.Pages.AgentArrangeInvokeType.optionAuto'),
      },
      {
        value: InvokeTypeEnum.ON_DEMAND,
        label: t('PC.Pages.AgentArrangeInvokeType.optionOnDemand'),
      },
    ],
    [],
  );

  const searchStrategyOptions = useMemo(
    () => [
      {
        value: SearchStrategyEnum.MIXED,
        label: t('PC.Pages.AgentArrangeKnowledgeSetting.searchMixed'),
      },
      {
        value: SearchStrategyEnum.SEMANTIC,
        label: t('PC.Pages.AgentArrangeKnowledgeSetting.searchSemantic'),
      },
      {
        value: SearchStrategyEnum.FULL_TEXT,
        label: t('PC.Pages.AgentArrangeKnowledgeSetting.searchFullText'),
      },
    ],
    [],
  );

  const noRecallResponseOptions = useMemo(
    () => [
      {
        value: NoneRecallReplyTypeEnum.DEFAULT,
        label: t('PC.Pages.AgentArrangeKnowledgeSetting.noRecallDefault'),
      },
      {
        value: NoneRecallReplyTypeEnum.CUSTOM,
        label: t('PC.Pages.AgentArrangeKnowledgeSetting.noRecallCustom'),
      },
    ],
    [],
  );

  return (
    <Modal
      title={t('PC.Pages.AgentArrangeKnowledgeSetting.title')}
      open={open}
      footer={null}
      onCancel={onCancel}
    >
      <div className={cx(styles.container)}>
        <h3 className={cx(styles.title)}>
          {t('PC.Pages.AgentArrangeKnowledgeSetting.recallSection')}
        </h3>
        {/*调用方式*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label={t('PC.Pages.AgentArrangeKnowledgeSetting.invokeType')}
            title={t('PC.Pages.AgentArrangeKnowledgeSetting.invokeTypeTip')}
          />
          <Radio.Group
            onChange={(e) =>
              handleChangeKnowledge('invokeType', e.target.value)
            }
            value={componentBindConfig.invokeType}
            options={invokeTypeOptions}
          />
        </div>
        {/*搜索策略*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label={t('PC.Pages.AgentArrangeKnowledgeSetting.searchStrategy')}
            title={t('PC.Pages.AgentArrangeKnowledgeSetting.searchStrategyTip')}
          />
          <Radio.Group
            onChange={(e) =>
              handleChangeKnowledge('searchStrategy', e.target.value)
            }
            value={componentBindConfig.searchStrategy}
            options={searchStrategyOptions}
          />
        </div>
        {/*最大召回数量*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label={t('PC.Pages.AgentArrangeKnowledgeSetting.maxRecallCount')}
            title={t('PC.Pages.AgentArrangeKnowledgeSetting.maxRecallCountTip')}
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
            label={t('PC.Pages.AgentArrangeKnowledgeSetting.minMatchingDegree')}
            title={t(
              'PC.Pages.AgentArrangeKnowledgeSetting.minMatchingDegreeTip',
            )}
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
        <h3 className={cx(styles.title)}>
          {t('PC.Pages.AgentArrangeKnowledgeSetting.replySection')}
        </h3>
        {/*无召回回复*/}
        <div className={cx('flex', 'mb-16')}>
          <LabelIcon
            label={t('PC.Pages.AgentArrangeKnowledgeSetting.noRecallReply')}
            title={t('PC.Pages.AgentArrangeKnowledgeSetting.noRecallReplyTip')}
          />
          <Radio.Group
            onChange={(e) =>
              handleChangeKnowledge('noneRecallReplyType', e.target.value)
            }
            value={componentBindConfig.noneRecallReplyType}
            options={noRecallResponseOptions}
          />
        </div>
        <ConditionRender
          condition={
            componentBindConfig.noneRecallReplyType ===
            NoneRecallReplyTypeEnum.CUSTOM
          }
        >
          <Input.TextArea
            placeholder={t(
              'PC.Pages.AgentArrangeKnowledgeSetting.noRecallReplyPlaceholder',
            )}
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
