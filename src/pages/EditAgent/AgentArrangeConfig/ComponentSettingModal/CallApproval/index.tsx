import { t } from '@/services/i18nRuntime';
import { DefaultSelectedEnum } from '@/types/enums/agent';
import { CallApprovalProps } from '@/types/interfaces/agentConfig';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Radio, RadioChangeEvent, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 调用审批设置
 */
const CallApproval: React.FC<CallApprovalProps> = ({
  callApproval,
  onSaveSet,
}) => {
  const [callApprovalType, setCallApprovalType] =
    useState<DefaultSelectedEnum>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setCallApprovalType(callApproval ?? DefaultSelectedEnum.No);
  }, [callApproval]);

  const callApprovalOptions = useMemo(
    () => [
      {
        value: DefaultSelectedEnum.No,
        label: t('PC.Pages.AgentArrangeCallApproval.optionNo'),
      },
      {
        value: DefaultSelectedEnum.Yes,
        label: t('PC.Pages.AgentArrangeCallApproval.optionYes'),
      },
    ],
    [],
  );

  const handleChangeType = ({ target: { value } }: RadioChangeEvent) => {
    setCallApprovalType(value);
  };

  const handleSave = async () => {
    const data = {
      callApproval: callApprovalType as DefaultSelectedEnum,
    };
    setLoading(true);
    await onSaveSet(data);
    setLoading(false);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1', styles.content)}>
        <h3 className={cx('gap-6', 'flex', 'items-center')}>
          <span>{t('PC.Pages.AgentArrangeCallApproval.title')}</span>
          <Tooltip title={t('PC.Pages.AgentArrangeCallApproval.tooltip')}>
            <ExclamationCircleOutlined className={cx(styles.icon)} />
          </Tooltip>
        </h3>
        <Radio.Group
          options={callApprovalOptions}
          onChange={handleChangeType}
          value={callApprovalType}
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

export default memo(CallApproval);
