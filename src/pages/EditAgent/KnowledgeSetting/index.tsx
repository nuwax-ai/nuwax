import LabelIcon from '@/components/LabelIcon';
import SliderNumber from '@/components/SliderNumber';
import {
  CALL_METHOD_OPTIONS,
  NO_RECALL_RESPONSE,
  SEARCH_STRATEGY_OPTIONS,
} from '@/constants/agent.constants';
import {
  CallMethodEnum,
  NoRecallResponseEnum,
  SearchStrategyEnum,
} from '@/types/enums/agent';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { InputNumberProps, RadioChangeEvent } from 'antd';
import { Divider, Modal, Radio, Switch } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface KnowledgeSettingProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 知识库设置
 */
const KnowledgeSetting: React.FC<KnowledgeSettingProps> = ({
  open,
  onCancel,
}) => {
  const [callMethod, setCallMethod] = useState<CallMethodEnum>(
    CallMethodEnum.Auto_Call,
  );
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategyEnum>(
    SearchStrategyEnum.MIXED,
  );
  const [noRecallResponse, setNoRecallResponse] =
    useState<NoRecallResponseEnum>(NoRecallResponseEnum.Default);
  // 最大召回数
  const [maxRecallNumber, setMaxRecallNumber] = useState<string>('5');
  // 最小匹配度
  const [minMatchDegree, setMinMatchDegree] = useState<string>('0.50');

  // 最大召回数change事件
  const handleMaxRecallNumber: InputNumberProps['onChange'] = (newValue) => {
    if (Number.isNaN(newValue)) {
      return;
    }
    setMaxRecallNumber(newValue.toString());
  };

  // 最小匹配度change事件
  const handleMinMatchDegree: InputNumberProps['onChange'] = (newValue) => {
    if (Number.isNaN(newValue)) {
      return;
    }
    setMinMatchDegree(newValue.toString());
  };

  // 切换调用方式
  const handleCallMethod = (e: RadioChangeEvent) => {
    setCallMethod(e.target.value);
  };

  // 切换搜索策略
  const handleSearchStrategy = (e: RadioChangeEvent) => {
    setSearchStrategy(e.target.value);
  };

  // 切换无召回回复
  const handleNoRecallResponse = (e: RadioChangeEvent) => {
    setNoRecallResponse(e.target.value);
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
            onChange={handleCallMethod}
            value={callMethod}
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
            onChange={handleSearchStrategy}
            value={searchStrategy}
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
            value={maxRecallNumber}
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
            value={minMatchDegree}
            onChange={handleMinMatchDegree}
          />
        </div>
        {/*查询改写*/}
        <div className={cx('flex', 'mb-16', 'items-center')}>
          <LabelIcon
            label="查询改写"
            type={TooltipTitleTypeEnum.White}
            // todo 待确定
            title="根据设置的匹配度选取段落返回给大模型,低于设定匹配度的内容不会被召回"
          />
          <Switch size="small" />
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
            onChange={handleNoRecallResponse}
            value={noRecallResponse}
            options={NO_RECALL_RESPONSE}
          />
        </div>
        {/*<OverrideTextArea name={''} maxLength={500} />*/}
      </div>
    </Modal>
  );
};

export default KnowledgeSetting;
