import { SvgIcon } from '@/components/base';
import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { SUB_AGENT_PROMPT_TEMPLATE } from '@/constants/common.constants';
import { SubAgent } from '@/types/interfaces/agent';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SubAgentEditModalProps {
  open: boolean;
  initialValue?: SubAgent;
  onConfirm: (agent: SubAgent) => void;
  onCancel: () => void;
}

/**
 * 从 prompt 中提取 name 和 description
 * 格式：---\nname: xxx\ndescription: xxx\n---
 */
const extractNameAndDescription = (
  prompt: string,
): { name: string; description: string } => {
  // 允许开头有空白字符，更加宽容的匹配
  const match = prompt.match(/^\s*---\n([\s\S]*?)\n\s*---/);
  if (!match) return { name: '', description: '' };

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.*)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.*)$/m);

  return {
    name: nameMatch?.[1]?.trim() || '',
    description: descMatch?.[1]?.trim() || '',
  };
};

/**
 * 子智能体编辑弹窗
 */
const SubAgentEditModal: React.FC<SubAgentEditModalProps> = ({
  open,
  initialValue,
  onConfirm,
  onCancel,
}) => {
  const [prompt, setPrompt] = useState<string>('');

  useEffect(() => {
    if (open) {
      setPrompt(initialValue?.prompt || '');
    }
  }, [open, initialValue]);

  const handleImportTemplate = () => {
    setPrompt(SUB_AGENT_PROMPT_TEMPLATE);
  };

  const handleConfirm = () => {
    const plainText = extractTextFromHTML(prompt);
    const { name, description } = extractNameAndDescription(plainText);
    onConfirm({ name, description, prompt: plainText });
  };

  const isEdit = !!initialValue;

  return (
    <Modal
      title={isEdit ? '编辑子智能体' : '新建子智能体'}
      open={open}
      onOk={handleConfirm}
      onCancel={onCancel}
      width={600}
      okText="确定"
      cancelText="取消"
    >
      <div className={cx(styles['modal-content'])}>
        <div className={cx(styles['form-item'])}>
          <div
            className={cx(
              'flex',
              'content-between',
              'items-center',
              styles['form-label-row'],
            )}
          >
            <label className={cx(styles['form-label'])}></label>
            <Button
              size="small"
              icon={
                <SvgIcon
                  style={{ fontSize: '12px' }}
                  name="icons-common-import"
                />
              }
              onClick={handleImportTemplate}
            >
              导入模版
            </Button>
          </div>
          <TiptapVariableInput
            value={prompt}
            onChange={setPrompt}
            placeholder="请输入子智能体 Prompt"
          />
        </div>
      </div>
    </Modal>
  );
};

export default SubAgentEditModal;
