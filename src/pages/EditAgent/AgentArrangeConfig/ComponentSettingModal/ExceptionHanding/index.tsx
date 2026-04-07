import ConditionRender from '@/components/ConditionRender';
import LabelStar from '@/components/LabelStar';
import { t } from '@/services/i18nRuntime';
import { DefaultSelectedEnum } from '@/types/enums/agent';
import {
  ExceptionHandingProps,
  ExceptionHandingSaveParams,
} from '@/types/interfaces/agentConfig';
import { Button, Input, Switch } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 异常处理
const ExceptionHanding: React.FC<ExceptionHandingProps> = ({
  exceptionOut,
  fallbackMsg,
  onSaveSet,
}) => {
  // 是否默认选中
  const [selected, setSelected] = useState<DefaultSelectedEnum>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setContent(fallbackMsg || '');
    setSelected(exceptionOut || DefaultSelectedEnum.No);
  }, [exceptionOut, fallbackMsg]);

  // 禁用保存按钮
  const disabled = useMemo(() => {
    if (selected === DefaultSelectedEnum.Yes && !content) {
      return true;
    }
    return false;
  }, [selected, content]);

  // 保存
  const handleSave = async () => {
    const data: ExceptionHandingSaveParams = {
      exceptionOut: selected as DefaultSelectedEnum,
      fallbackMsg: content,
    };
    setLoading(true);
    await onSaveSet(data);
    setLoading(false);
  };

  // 切换异步运行状态
  const onChange = (checked: boolean) => {
    const isSelected = checked
      ? DefaultSelectedEnum.Yes
      : DefaultSelectedEnum.No;
    setSelected(isSelected);
  };

  return (
    <div className={cx('flex', 'flex-col', 'h-full', styles.container)}>
      <div className={cx('flex-1', styles.content)}>
        <header className={cx('flex', 'items-center', styles.header)}>
          <h3 className={cx('flex-1')}>
            {t('PC.Pages.AgentArrangeExceptionHandling.title')}
          </h3>
          <Switch
            checked={selected === DefaultSelectedEnum.Yes}
            onChange={onChange}
          />
        </header>
        <p className={cx(styles.desc)}>
          {t('PC.Pages.AgentArrangeExceptionHandling.description')}
        </p>
        <ConditionRender condition={selected}>
          <LabelStar
            className={cx(styles['reply-content'])}
            label={t('PC.Pages.AgentArrangeExceptionHandling.defaultInfo')}
          />
          <Input.TextArea
            className={cx('dispose-textarea-count')}
            classNames={{
              textarea: cx(styles.textarea),
            }}
            placeholder={t(
              'PC.Pages.AgentArrangeExceptionHandling.defaultInfoPlaceholder',
            )}
            autoSize={{ minRows: 5, maxRows: 6 }}
            maxLength={1000}
            showCount
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </ConditionRender>
      </div>
      <footer className={cx(styles.footer)}>
        <Button
          type="primary"
          onClick={handleSave}
          loading={loading}
          className={cx({ [styles['btn-disabled']]: disabled })}
          disabled={disabled}
        >
          {t('PC.Common.Global.save')}
        </Button>
      </footer>
    </div>
  );
};

export default ExceptionHanding;
