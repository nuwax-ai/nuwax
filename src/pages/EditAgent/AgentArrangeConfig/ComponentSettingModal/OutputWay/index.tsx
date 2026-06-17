import { t } from '@/services/i18nRuntime';
import { OutputDirectlyEnum } from '@/types/enums/agent';
import { OutputWayProps } from '@/types/interfaces/agentConfig';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Radio, RadioChangeEvent, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 输出方式
const OutputWay: React.FC<OutputWayProps> = ({ directOutput, onSaveSet }) => {
  const [outputDirectlyType, setOutputDirectlyType] =
    useState<OutputDirectlyEnum>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setOutputDirectlyType(directOutput || OutputDirectlyEnum.No);
  }, [directOutput]);

  const outputWayOptions = useMemo(
    () => [
      {
        value: OutputDirectlyEnum.No,
        label: t('PC.Pages.AgentArrangeOutputWay.optionNo'),
      },
      {
        value: OutputDirectlyEnum.Yes,
        label: t('PC.Pages.AgentArrangeOutputWay.optionYes'),
      },
    ],
    [],
  );

  // 切换调用方式
  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    setOutputDirectlyType(value);
  };

  // 保存
  const handleSave = async () => {
    const data = {
      directOutput: outputDirectlyType as OutputDirectlyEnum,
    };
    setLoading(true);
    await onSaveSet(data);
    setLoading(false);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1', styles.content)}>
        <h3 className={cx('gap-6', 'flex', 'items-center')}>
          <span>{t('PC.Pages.AgentArrangeOutputWay.title')}</span>
          <Tooltip title={t('PC.Pages.AgentArrangeOutputWay.tooltip')}>
            <ExclamationCircleOutlined className={cx(styles.icon)} />
          </Tooltip>
        </h3>
        <Radio.Group
          options={outputWayOptions}
          onChange={handleChangeType}
          value={outputDirectlyType}
        />
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          {t('PC.Common.Global.save')}
        </Button>
      </footer>
    </div>
  );
};

export default memo(OutputWay);
