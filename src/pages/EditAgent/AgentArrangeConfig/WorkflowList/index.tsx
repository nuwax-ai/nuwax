import workflowImage from '@/assets/images/workflow_image.png';
import TooltipIcon from '@/components/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import type { WorkflowListProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import AgentModelComponent from '../AgentModelComponent';

// 工作流组件列表
const WorkflowList: React.FC<WorkflowListProps> = ({ list, onSet, onDel }) => {
  return !list?.length ? (
    <p>
      工作流支持通过可视化的方式，对插件、大语言模型、代码块等功能进行组合，从而实现复杂、稳定的业务流程编排，例如旅行规划、报告分析等。
    </p>
  ) : (
    list.map((item) => (
      <AgentModelComponent
        key={item.id}
        agentComponentInfo={item}
        defaultImage={workflowImage as string}
        extra={
          <>
            <TooltipIcon
              title="设置"
              icon={
                <ICON_SETTING
                  className={'cursor-pointer'}
                  onClick={() => onSet(item.id)}
                />
              }
            />
            <TooltipIcon
              title="删除"
              icon={
                <DeleteOutlined
                  className={'cursor-pointer'}
                  onClick={() => onDel(item.id, item.targetId, item.type)}
                />
              }
            />
          </>
        }
      />
    ))
  );
};

export default WorkflowList;
