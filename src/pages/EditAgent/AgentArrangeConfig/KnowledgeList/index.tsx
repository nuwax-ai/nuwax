import knowledgeImage from '@/assets/images/knowledge_image.png';
import TooltipIcon from '@/components/TooltipIcon';
import { AgentComponentInfo } from '@/types/interfaces/agent';
import type { KnowledgeTextListProps } from '@/types/interfaces/agentConfig';
import { CaretDownOutlined, DeleteOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useState } from 'react';
import AgentModelComponent from '../AgentModelComponent';
import styles from './index.less';
import KnowledgeSetting from './KnowledgeSetting';

const cx = classNames.bind(styles);

/**
 * 知识库文本列表
 */
const KnowledgeTextList: React.FC<KnowledgeTextListProps> = ({
  list,
  onDel,
}) => {
  const [openKnowledgeModel, setOpenKnowledgeModel] = useState<boolean>(false);
  const [agentComponentInfo, setAgentComponentInfo] =
    useState<AgentComponentInfo | null>(null);

  const handleClick = (item: AgentComponentInfo) => {
    setOpenKnowledgeModel(true);
    setAgentComponentInfo(item);
  };
  return !list?.length ? (
    <p>
      将文档、URL、三方数据源上传为文本知识库后，用户发送消息时，智能体能够引用文本知识中的内容回答用户问题。
    </p>
  ) : (
    <>
      {list.map((item) => (
        <AgentModelComponent
          key={item.id}
          agentComponentInfo={item}
          defaultImage={knowledgeImage as string}
          extra={
            <>
              <span
                className={cx(
                  'cursor-pointer',
                  'hover-box',
                  styles['knowledge-extra'],
                )}
                onClick={() => handleClick(item)}
              >
                按需调用 <CaretDownOutlined />
              </span>
              <TooltipIcon
                title="取消知识库"
                icon={
                  <DeleteOutlined
                    className={'cursor-pointer'}
                    onClick={() => onDel(item.id)}
                  />
                }
              />
            </>
          }
        />
      ))}
      {/*知识库设置*/}
      <KnowledgeSetting
        agentComponentInfo={agentComponentInfo}
        open={openKnowledgeModel}
        onCancel={() => setOpenKnowledgeModel(false)}
      />
    </>
  );
};

export default KnowledgeTextList;
