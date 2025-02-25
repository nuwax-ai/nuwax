import workflowImage from '@/assets/images/workflow_image.png';
import TooltipIcon from '@/components/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import AgentModelComponent from '@/pages/EditAgent/AgentArrangeConfig/AgentModelComponent';
import { AgentComponentInfo } from '@/types/interfaces/agent';
import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface TriggerContentProps {
  list: AgentComponentInfo[];
  onDel: (id: number) => void;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

// 触发器内容文本
const TriggerContent: React.FC<TriggerContentProps> = ({
  list,
  onDel,
  checked,
  onChange,
}) => {
  return (
    <>
      {list.map((item) => (
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
      ))}
      <div className={cx('flex', 'items-center')}>
        <p className={cx(styles['trigger-text'])}>
          允许用户在对话中创建定时任务
        </p>
        <Tooltip title="允许用户在与智能体对话过程中，根据用户所在时区创建定时任务。例如“每天早上八点推送新闻”。每个对话中最多创建 3 条定时任务。">
          <InfoCircleOutlined />
        </Tooltip>
        <Switch
          size="small"
          className={styles.switch}
          checked={checked}
          onChange={onChange}
        />
      </div>
    </>
  );
};

export default TriggerContent;
