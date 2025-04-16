import pluginImage from '@/assets/images/plugin_image.png';
import TooltipIcon from '@/components/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import type { PluginListProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import AgentModelComponent from '../AgentModelComponent';

// 插件组件列表
const PluginList: React.FC<PluginListProps> = ({ list, onSet, onDel }) => {
  return !list?.length ? (
    <p>
      插件能够让智能体调用外部
      API，例如搜索信息、浏览网页、生成图片等，扩展智能体的能力和使用场景。
    </p>
  ) : (
    list.map((item) => (
      <AgentModelComponent
        key={item.id}
        agentComponentInfo={item}
        defaultImage={pluginImage as string}
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

export default PluginList;
