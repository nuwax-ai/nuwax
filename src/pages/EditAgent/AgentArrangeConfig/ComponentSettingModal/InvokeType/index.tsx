import ConditionRender from '@/components/ConditionRender';
import {
  CALL_DEFAULT_SELECTED,
  CALL_METHOD_OPTIONS,
} from '@/constants/agent.constants';
import { DefaultSelectedEnum, InvokeTypeEnum } from '@/types/enums/agent';
import type {
  InvokeTypeProps,
  InvokeTypeSaveParams,
} from '@/types/interfaces/agentConfig';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Input, Radio, RadioChangeEvent, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 调用方式
const InvokeType: React.FC<InvokeTypeProps> = ({
  options = CALL_METHOD_OPTIONS,
  invokeType,
  onSaveSet,
  defaultSelected,
  defaultAlias,
  isSkill,
  tooltip = (
    <div>
      <p>自动调用：用户每次发送消息后都会触发调用一次</p>
      <p>按需调用：由模型根据任务情况决定是否需要调用</p>
      <p>
        手动选择：由用户决定是否使用该工具，在用户选择的情况下和自动调用效果一样
      </p>
      <p>
        手动选择+按需调用：用户选择后，由模型根据任务情况选择是否需要调用；用户不选择则不会调用
      </p>
    </div>
  ),
}) => {
  const [type, setType] = useState<InvokeTypeEnum>();
  // 是否默认选中
  const [selected, setSelected] = useState<DefaultSelectedEnum>(
    DefaultSelectedEnum.No,
  );

  // 展示别名
  const [alias, setAlias] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setType(invokeType || InvokeTypeEnum.AUTO);
    setSelected(defaultSelected || DefaultSelectedEnum.No);
    setAlias(defaultAlias || '');
  }, [invokeType, defaultSelected, defaultAlias]);

  // 切换调用方式
  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    setType(value);
  };

  // 保存
  const handleSave = async () => {
    const data: InvokeTypeSaveParams = {
      invokeType: type as InvokeTypeEnum,
      defaultSelected: selected,
    };

    // 技能时，展示别名
    if (isSkill) {
      data.alias = alias;
    }
    setLoading(true);
    await onSaveSet(data);
    setLoading(false);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1')}>
        <h3 className={cx('gap-6', 'flex', 'items-center')}>
          <span>调用方式</span>
          <Tooltip title={tooltip}>
            <ExclamationCircleOutlined className={cx(styles.icon)} />
          </Tooltip>
        </h3>
        <Radio.Group
          options={options}
          onChange={handleChangeType}
          value={type}
        />
        {/* 手动选择和手动选择+按需调用时才显示 */}
        <ConditionRender
          condition={
            type === InvokeTypeEnum.MANUAL ||
            type === InvokeTypeEnum.MANUAL_ON_DEMAND
          }
        >
          <h3 className={cx('mt-16')}>是否默认选中</h3>
          <Radio.Group
            options={CALL_DEFAULT_SELECTED}
            onChange={(e) => setSelected(e.target.value as DefaultSelectedEnum)}
            value={selected}
          />
        </ConditionRender>

        {/* skill手动选择时显示 （技能时，MANUAL_ON_DEMAND代表手动选择, 跟插件、工作流等不同） */}
        <ConditionRender
          condition={isSkill && type === InvokeTypeEnum.MANUAL_ON_DEMAND}
        >
          <h3 className={cx('gap-6', 'flex', 'items-center', 'mt-16')}>
            <span>展示别名</span>
            <Tooltip title="可选，若填写，前端优先展示该名称">
              <ExclamationCircleOutlined className={cx(styles.icon)} />
            </Tooltip>
          </h3>
          <Input
            className={cx(styles['alias-input'])}
            placeholder="请输入展示别名"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
        </ConditionRender>
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default memo(InvokeType);
