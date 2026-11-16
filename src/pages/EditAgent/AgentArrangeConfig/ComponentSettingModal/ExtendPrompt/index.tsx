import { t } from '@/services/i18nRuntime';
import type {
  ExtendPromptProps,
  ExtendPromptSaveParams,
} from '@/types/interfaces/agentConfig';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 技能设置 - 额外提示词
 * 字段：bindConfig.extendPrompt，保存走 /api/agent/component/skill/update
 */
const ExtendPrompt: React.FC<ExtendPromptProps> = ({
  extendPrompt,
  onSaveSet,
}) => {
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setValue(extendPrompt || '');
  }, [extendPrompt]);

  const handleSave = async () => {
    const data: ExtendPromptSaveParams = {
      extendPrompt: value,
    };
    setLoading(true);
    try {
      await onSaveSet(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div className={cx('flex-1', styles.content)}>
        <h3>{t('PC.Pages.AgentArrangeExtendPrompt.title')}</h3>
        <Input.TextArea
          className={cx('dispose-textarea-count')}
          classNames={{
            textarea: cx(styles.textarea),
          }}
          placeholder={t('PC.Pages.AgentArrangeExtendPrompt.placeholder')}
          autoSize={{ minRows: 6, maxRows: 12 }}
          maxLength={2000}
          showCount
          value={value}
          onChange={(e) => setValue(e.target.value)}
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

export default memo(ExtendPrompt);
