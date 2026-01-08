import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { SubAgent } from '@/types/interfaces/agent';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';
import SubAgentEditModal from './SubAgentEditModal';

const cx = classNames.bind(styles);

/**
 * 从 prompt 中提取 description
 * 格式：---\nname: xxx\ndescription: xxx\n---
 */
const extractDescriptionFromPrompt = (prompt: string): string => {
  if (!prompt) return '';
  const match = prompt.match(/^\s*---\n([\s\S]*?)\n\s*---/);
  if (!match) return '';
  const frontmatter = match[1];
  const descMatch = frontmatter.match(/^description:\s*(.*)$/m);
  return descMatch?.[1]?.trim() || '';
};

interface SubAgentConfigProps {
  subAgents: SubAgent[];
  onUpdate: (agents: SubAgent[]) => void;
}

/**
 * 子智能体配置 - 列表视图
 */
const SubAgentConfig: React.FC<SubAgentConfigProps> = ({
  subAgents = [],
  onUpdate,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // 打开新建弹窗
  const handleAdd = () => {
    setEditIndex(null);
    setModalOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (index: number) => {
    setEditIndex(index);
    setModalOpen(true);
  };

  // 删除子智能体
  const handleDelete = (index: number) => {
    const newAgents = [...subAgents];
    newAgents.splice(index, 1);
    onUpdate?.(newAgents);
  };

  // 确认保存
  const handleConfirm = (agent: SubAgent) => {
    const newAgents = [...(subAgents || [])];
    if (editIndex !== null) {
      // 编辑模式
      newAgents[editIndex] = agent;
    } else {
      // 新建模式
      newAgents.push(agent);
    }
    onUpdate?.(newAgents);
    setModalOpen(false);
  };

  const currentAgent = editIndex !== null ? subAgents[editIndex] : undefined;

  // 预处理子智能体列表，从 prompt 中提取 description
  const processedAgents = useMemo(() => {
    return (
      subAgents?.map((agent) => ({
        ...agent,
        // 优先使用已有的 description，否则从 prompt 中提取
        description:
          agent.description || extractDescriptionFromPrompt(agent.prompt),
      })) || []
    );
  }, [subAgents]);

  return (
    <div>
      {/* 隐藏的添加按钮，供父组件触发 */}
      <button
        type="button"
        data-subagent-add
        style={{ display: 'none' }}
        onClick={handleAdd}
      />

      {/* 空状态 */}
      {!processedAgents?.length && (
        <p className={cx(styles['empty-text'])}>
          暂无子智能体配置，点击右上角添加
        </p>
      )}

      {/* 列表 */}
      {processedAgents?.map((agent, index) => (
        <div key={index} className={cx(styles['agent-item'])}>
          <div className={cx(styles['agent-content'])}>
            <span className={cx(styles['icon-box'])}>
              <SvgIcon name="icons-nav-stars" style={{ fontSize: 12 }} />
            </span>
            <div className={cx(styles['text-content'])}>
              <h3 className={cx(styles['agent-name'])}>
                {agent.name || `子智能体 ${index + 1}`}
              </h3>
              <ConditionRender condition={agent.description}>
                <p className={cx(styles['agent-desc'])}>{agent.description}</p>
              </ConditionRender>
            </div>
          </div>
          <div className={cx(styles['agent-actions'])}>
            <TooltipIcon
              title="编辑"
              icon={<EditOutlined className="cursor-pointer" />}
              onClick={() => handleEdit(index)}
            />
            <TooltipIcon
              title="删除"
              icon={<DeleteOutlined className="cursor-pointer" />}
              onClick={() => handleDelete(index)}
            />
          </div>
        </div>
      ))}

      {/* 编辑弹窗 */}
      <SubAgentEditModal
        open={modalOpen}
        initialValue={currentAgent}
        onConfirm={handleConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default SubAgentConfig;
