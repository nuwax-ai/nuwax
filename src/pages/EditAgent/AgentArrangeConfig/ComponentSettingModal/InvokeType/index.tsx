import ConditionRender from '@/components/ConditionRender';
import { t } from '@/services/i18nRuntime';
import { DefaultSelectedEnum, InvokeTypeEnum } from '@/types/enums/agent';
import type {
  InvokeTypeProps,
  InvokeTypeSaveParams,
} from '@/types/interfaces/agentConfig';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Input, Radio, RadioChangeEvent, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 调用方式
const InvokeType: React.FC<InvokeTypeProps> = ({
  options,
  invokeType,
  onSaveSet,
  defaultSelected,
  defaultAlias,
  isSkill,
  tooltip,
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

  const invokeTypeOptions = useMemo(() => {
    const sourceOptions =
      options && options.length
        ? options
        : [
            { value: InvokeTypeEnum.AUTO, label: '' },
            { value: InvokeTypeEnum.ON_DEMAND, label: '' },
            { value: InvokeTypeEnum.MANUAL, label: '' },
            { value: InvokeTypeEnum.MANUAL_ON_DEMAND, label: '' },
          ];

    return sourceOptions.map(({ value }) => {
      if (value === InvokeTypeEnum.AUTO) {
        return {
          value,
          label: t('PC.Pages.AgentArrangeInvokeType.optionAuto'),
        };
      }
      if (value === InvokeTypeEnum.ON_DEMAND) {
        return {
          value,
          label: t('PC.Pages.AgentArrangeInvokeType.optionOnDemand'),
        };
      }
      if (value === InvokeTypeEnum.MANUAL) {
        return {
          value,
          label: t('PC.Pages.AgentArrangeInvokeType.optionManual'),
        };
      }
      return {
        value,
        label: t('PC.Pages.AgentArrangeInvokeType.optionManualOnDemand'),
      };
    });
  }, [options]);

  const defaultSelectedOptions = useMemo(
    () => [
      {
        value: DefaultSelectedEnum.No,
        label: t('PC.Pages.AgentArrangeInvokeType.optionNo'),
      },
      {
        value: DefaultSelectedEnum.Yes,
        label: t('PC.Pages.AgentArrangeInvokeType.optionYes'),
      },
    ],
    [],
  );

  const defaultTooltip = (
    <div>
      <p>{t('PC.Pages.AgentArrangeInvokeType.autoDescription')}</p>
      <p>{t('PC.Pages.AgentArrangeInvokeType.onDemandDescription')}</p>
      <p>{t('PC.Pages.AgentArrangeInvokeType.manualDescription')}</p>
      <p>{t('PC.Pages.AgentArrangeInvokeType.manualOnDemandDescription')}</p>
    </div>
  );

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
      <div className={cx('flex-1', styles.content)}>
        <h3 className={cx('gap-6', 'flex', 'items-center')}>
          <span>{t('PC.Pages.AgentArrangeInvokeType.title')}</span>
          <Tooltip title={tooltip || defaultTooltip}>
            <ExclamationCircleOutlined className={cx(styles.icon)} />
          </Tooltip>
        </h3>
        <Radio.Group
          options={invokeTypeOptions}
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
          <h3 className={cx('mt-16')}>
            {t('PC.Pages.AgentArrangeInvokeType.defaultSelected')}
          </h3>
          <Radio.Group
            options={defaultSelectedOptions}
            onChange={(e) => setSelected(e.target.value as DefaultSelectedEnum)}
            value={selected}
          />
        </ConditionRender>

        {/* skill手动选择时显示 （技能时，MANUAL_ON_DEMAND代表手动选择, 跟插件、工作流等不同） */}
        <ConditionRender
          condition={isSkill && type === InvokeTypeEnum.MANUAL_ON_DEMAND}
        >
          <h3 className={cx('gap-6', 'flex', 'items-center', 'mt-16')}>
            <span>{t('PC.Pages.AgentArrangeInvokeType.alias')}</span>
            <Tooltip title={t('PC.Pages.AgentArrangeInvokeType.aliasTooltip')}>
              <ExclamationCircleOutlined className={cx(styles.icon)} />
            </Tooltip>
          </h3>
          <Input
            className={cx(styles['alias-input'])}
            placeholder={t('PC.Pages.AgentArrangeInvokeType.aliasPlaceholder')}
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
        </ConditionRender>
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          {t('PC.Common.Global.save')}
        </Button>
      </footer>
    </div>
  );
};

export default memo(InvokeType);
