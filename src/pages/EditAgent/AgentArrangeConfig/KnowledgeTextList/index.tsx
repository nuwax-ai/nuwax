import knowledgeImage from '@/assets/images/knowledge_image.png';
import CollapseComponentItem from '@/components/CollapseComponentItem';
import TooltipIcon from '@/components/TooltipIcon';
import { AgentComponentTypeEnum, InvokeTypeEnum } from '@/types/enums/agent';
import { AgentComponentInfo } from '@/types/interfaces/agent';
import type { KnowledgeTextListProps } from '@/types/interfaces/agentConfig';
import {
  CaretDownOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';
import KnowledgeSetting from './KnowledgeSetting';

const cx = classNames.bind(styles);

/**
 * 知识库文本列表
 */
const KnowledgeTextList: React.FC<KnowledgeTextListProps> = ({
  textClassName,
  list,
  deleteList,
  onDel,
}) => {
  const [openKnowledgeModel, setOpenKnowledgeModel] = useState<boolean>(false);
  const [agentComponentInfo, setAgentComponentInfo] =
    useState<AgentComponentInfo>();

  const handleClick = (item: AgentComponentInfo) => {
    setOpenKnowledgeModel(true);
    setAgentComponentInfo(item);
  };

  // 是否正在删除
  const isDeling = (targetId: number, type: AgentComponentTypeEnum) => {
    return deleteList?.some(
      (item) => item.targetId === targetId && item.type === type,
    );
  };

  // 删除组件
  const handleDelete = (item: AgentComponentInfo) => {
    const { targetId, type } = item;
    if (isDeling(targetId, type)) {
      return;
    }
    onDel(item.id, item.targetId, item.type);
  };

  return !list?.length ? (
    <p className={cx(textClassName)}>
      将文档、URL、三方数据源上传为文本知识库后，用户发送消息时，智能体能够引用文本知识中的内容回答用户问题。
    </p>
  ) : (
    <>
      {list.map((item) => (
        <CollapseComponentItem
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
                {item?.bindConfig?.invokeType === InvokeTypeEnum.AUTO
                  ? '自动调用'
                  : '按需调用'}
                <CaretDownOutlined />
              </span>
              <TooltipIcon
                title="取消知识库"
                icon={
                  isDeling(item.targetId, item.type) ? (
                    <LoadingOutlined />
                  ) : (
                    <DeleteOutlined className={cx('cursor-pointer')} />
                  )
                }
                onClick={() => handleDelete(item)}
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
