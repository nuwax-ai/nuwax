import ConditionRender from '@/components/ConditionRender';
import LabelStar from '@/components/LabelStar';
import { t } from '@/services/i18nRuntime';
import { DefaultSelectedEnum } from '@/types/enums/agent';
import {
  AsyncRunProps,
  AsyncRunSaveParams,
} from '@/types/interfaces/agentConfig';
import { Button, Input, Switch } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 异步运行
const AsyncRun: React.FC<AsyncRunProps> = ({
  async,
  asyncReplyContent,
  onSaveSet,
}) => {
  // 是否默认选中
  const [selected, setSelected] = useState<DefaultSelectedEnum>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setContent(
      asyncReplyContent ||
        t('PC.Pages.AgentArrangeAsyncRun.defaultReplyContent'),
    );
    setSelected(async || DefaultSelectedEnum.No);
  }, [async, asyncReplyContent]);

  // 禁用保存按钮
  const disabled = useMemo(() => {
    if (selected === DefaultSelectedEnum.Yes && !content) {
      return true;
    }
    return false;
  }, [selected, content]);

  // 保存
  const handleSave = async () => {
    const data: AsyncRunSaveParams = {
      async: selected as DefaultSelectedEnum,
      asyncReplyContent: content,
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
            {t('PC.Pages.AgentArrangeAsyncRun.title')}
          </h3>
          <Switch
            checked={selected === DefaultSelectedEnum.Yes}
            onChange={onChange}
          />
        </header>
        <p className={cx(styles.desc)}>
          {t('PC.Pages.AgentArrangeAsyncRun.description')}
        </p>
        <ConditionRender condition={selected}>
          <LabelStar
            className={cx(styles['reply-content'])}
            label={t('PC.Pages.AgentArrangeAsyncRun.replyContent')}
          />
          <Input.TextArea
            className={cx('dispose-textarea-count')}
            classNames={{
              textarea: cx(styles.textarea),
            }}
            placeholder={t(
              'PC.Pages.AgentArrangeAsyncRun.replyContentPlaceholder',
            )}
            autoSize={{ minRows: 5, maxRows: 6 }}
            maxLength={1000}
            showCount
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <ConditionRender condition={!content}>
            <p className={cx(styles.tips)}>
              {t('PC.Pages.AgentArrangeAsyncRun.replyContentRequired')}
            </p>
          </ConditionRender>
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

export default AsyncRun;
