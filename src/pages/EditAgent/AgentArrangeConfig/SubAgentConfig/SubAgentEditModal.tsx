import { SvgIcon } from '@/components/base';
import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import {
  SITE_DOCUMENT_URL,
  SUB_AGENT_PROMPT_TEMPLATE,
} from '@/constants/common.constants';
import { SubAgent } from '@/types/interfaces/agent';
import { LinkOutlined } from '@ant-design/icons';
import { Button, Modal, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
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
 * - 支持新建/编辑模式
 * - 新建时默认填充模板内容
 * - 支持全屏切换
 * - 取消时如有修改会弹出确认提示
 * - 富文本编辑器支持撤销/重做快捷键
 */
const SubAgentEditModal: React.FC<SubAgentEditModalProps> = ({
  open,
  initialValue,
  onConfirm,
  onCancel,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 判断是否为编辑模式
  const isEdit = !!initialValue;

  // 记录初始值，用于判断是否有修改
  const initialPromptValue = useMemo(() => {
    // 新建模式默认填充模板，编辑模式使用原有内容
    return isEdit ? initialValue?.prompt || '' : SUB_AGENT_PROMPT_TEMPLATE;
  }, [isEdit, initialValue]);

  useEffect(() => {
    if (open) {
      // 新建模式默认填充模板，编辑模式使用原有内容
      setPrompt(initialPromptValue);
      setIsFullscreen(false);
    }
  }, [open, initialPromptValue]);

  /**
   * 导入模板
   */
  const handleImportTemplate = () => {
    setPrompt(SUB_AGENT_PROMPT_TEMPLATE);
  };

  /**
   * 确认保存
   */
  const handleConfirm = () => {
    const plainText = extractTextFromHTML(prompt);
    const { name, description } = extractNameAndDescription(plainText);
    onConfirm({ name, description, prompt: plainText });
  };

  /**
   * 判断内容是否有修改
   */
  const hasChanges = useMemo(() => {
    const currentText = extractTextFromHTML(prompt);
    const initialText = extractTextFromHTML(initialPromptValue);
    return currentText !== initialText;
  }, [prompt, initialPromptValue]);

  /**
   * 处理取消操作，有修改时弹出确认提示
   */
  const handleCancel = () => {
    if (hasChanges) {
      Modal.confirm({
        title: '确认取消',
        content: '你有未保存的修改，确定要取消吗？',
        okText: '确定取消',
        cancelText: '继续编辑',
        onOk: onCancel,
      });
    } else {
      onCancel();
    }
  };

  /**
   * 切换全屏模式
   */
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  /**
   * 打开文档链接
   */
  const handleOpenDoc = () => {
    window.open(SITE_DOCUMENT_URL, '_blank');
  };

  /**
   * 自定义标题：包含文档链接图标和全屏切换按钮
   */
  const modalTitle = (
    <div className={cx(styles['modal-title-wrapper'])}>
      <div className={cx('flex', 'items-center', 'gap-xs')}>
        <span>{isEdit ? '编辑子智能体' : '新建子智能体'}</span>
        <Tooltip title="查看文档">
          <LinkOutlined
            className={cx(styles['doc-link-icon'])}
            onClick={handleOpenDoc}
          />
        </Tooltip>
      </div>
      <Tooltip title={isFullscreen ? '退出全屏' : '全屏编辑'}>
        <Button
          type="text"
          size="small"
          icon={
            isFullscreen ? (
              <SvgIcon
                name="icons-common-zoom_out"
                style={{ fontSize: '14px' }}
              />
            ) : (
              <SvgIcon
                name="icons-common-zoom_in"
                style={{ fontSize: '14px' }}
              />
            )
          }
          onClick={toggleFullscreen}
        />
      </Tooltip>
    </div>
  );

  return (
    <Modal
      title={modalTitle}
      open={open}
      onOk={handleConfirm}
      onCancel={handleCancel}
      width={isFullscreen ? '100vw' : 600}
      okText="确定"
      cancelText="取消"
      closable={false}
      className={cx(isFullscreen && styles['fullscreen-modal'])}
      styles={{
        body: {
          height: isFullscreen ? 'calc(100vh - 110px)' : 'auto',
          overflow: 'auto',
        },
      }}
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
            enableHistory={true}
            className={cx(isFullscreen && styles['fullscreen-editor'])}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SubAgentEditModal;
