import { SvgIcon } from '@/components/base';
import PromptOptimizeModal from '@/components/PromptOptimizeModal';
import type { SystemTipsWordProps } from '@/types/interfaces/space';
import { Button, Input, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const { TextArea } = Input;

/**
 * 系统提示词组件
 */
const SystemTipsWord: React.FC<SystemTipsWordProps> = ({
  value,
  agentConfigInfo,
  onChange,
  onReplace,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const textareaRef = useRef<any | null>(null);

  const handleReplace = (value?: string) => {
    setOpen(false);
    onReplace(value);
  };

  return (
    <div className={cx('flex', 'flex-col', 'flex-1', styles.container)}>
      <div
        className={cx(
          'flex',
          'items-center',
          'content-between',
          styles['system-tips-wrapper'],
        )}
      >
        <span className={cx(styles['system-tips'])}>系统提示词</span>
        <Tooltip title="自动优化提示词" placement="top">
          <Button
            color="primary"
            variant="filled"
            size="small"
            className={cx(styles['optimize-btn'])}
            icon={
              <SvgIcon name="icons-common-stars" style={{ fontSize: 16 }} />
            }
            onClick={() => setOpen(true)}
          >
            优化
          </Button>
        </Tooltip>
      </div>
      <TextArea
        classNames={{
          textarea: 'flex-1',
        }}
        ref={textareaRef}
        rootClassName={styles['text-area']}
        placeholder={'输入系统提示词，对大模型进行角色塑造'}
        variant="borderless"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <PromptOptimizeModal
        open={open}
        onCancel={() => setOpen(false)}
        onReplace={handleReplace}
        targetId={agentConfigInfo?.id}
        defaultValue={
          value ||
          `${agentConfigInfo?.name || ''}` +
            `${agentConfigInfo?.description || ''}`
        }
      />
    </div>
  );
};

export default SystemTipsWord;
