import knowledgeImage from '@/assets/images/knowledge_image.png';
import CollapseComponentItem from '@/components/CollapseComponentItem';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { t } from '@/services/i18nRuntime';
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
      {t('PC.Pages.AgentArrangeKnowledgeTextList.emptyDescription')}
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
                  ? t('PC.Pages.AgentArrangeInvokeType.optionAuto')
                  : t('PC.Pages.AgentArrangeInvokeType.optionOnDemand')}
                <CaretDownOutlined />
              </span>
              <TooltipIcon
                title={t('PC.Pages.AgentArrangeKnowledgeTextList.remove')}
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
