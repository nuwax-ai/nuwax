import workflowImage from '@/assets/images/workflow_image.png';
import TooltipIcon from '@/components/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { AgentComponentInfo } from '@/types/interfaces/agent';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import AgentModelComponent from '../AgentModelComponent';

interface WorkflowListProps {
  list: AgentComponentInfo[];
  onDel: (id: number) => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ list, onDel }) => {
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
              icon={<ICON_SETTING className={'cursor-pointer'} />}
            />
            <TooltipIcon
              title="删除"
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
    ))
  );
};

export default WorkflowList;
