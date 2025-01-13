import { ICON_ADJUSTMENT, ICON_SUCCESS } from '@/constants/images.constants';
import type {
  ContentProps,
  PlugInItem,
  PlugInNodeContent,
  RightContent,
  WorkFlowContent,
  WorkFlowItem,
} from '@/types/interfaces/common';
import { ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { Button, Collapse, Divider, Popover, Tag } from 'antd';
import React from 'react';
import './index.less';

// 工作流的option
const OptionItem: React.FC<WorkFlowContent> = ({ props, onAdd }) => {
  const { icon, label, desc, tag, time } = props;
  return (
    <div className="dis-sb item-style">
      <div className="dis-left ">
        {/* 左侧的图片 */}
        {icon}
        {/* 具体的内容 */}
        <div className="dis-col">
          <p className="label-style">{label}</p>
          <p className="desc-style">{desc}</p>
          <Tag className="tag-style">{tag}</Tag>
          <p className="desc-style">发布于 {time}</p>
        </div>
      </div>
      <Button onClick={() => onAdd(props)}>复制并添加</Button>
    </div>
  );
};

// 插件的option
const PlugInOption = ({ props, onAdd }: PlugInNodeContent) => {
  const {
    icon,
    label,
    desc,
    tag,
    releaseTime,
    size,
    stat,
    time,
    successRate,
    cites,
    source,
    id,
    children,
  } = props;
  // 自定义头部内容
  const header = (
    <div className="dis-sb plugin-header-style">
      {/* 左侧的图片 */}
      <div className="svg-style">{icon}</div>
      <div className="dis-col plugin-header-content-style">
        <p className="plugin-header-label-style">{label}</p>
        <p className="margin-bottom-6">{desc}</p>
        <div className="margin-bottom-6">
          {tag.map((item) => (
            <Tag key={item.name} color="default">
              {item.name}
            </Tag>
          ))}
        </div>
        <div className="dis-sb">
          {/* 左侧的发布时间等 */}
          <div className="dis-left">
            <span>{source}</span>
            <Divider type="vertical" />
            <span>{releaseTime}</span>
            <span className="margin-left-6">{stat}</span>
          </div>
          {/* 右侧的统计信息 */}
          <div className="dis-right">
            <span>
              <ICON_ADJUSTMENT />
              {size}
            </span>
            <Divider type="vertical" />
            <span>
              <MessageOutlined />
              {cites}
            </span>
            <Divider type="vertical" />
            <span>
              <ClockCircleOutlined />
              {time}
            </span>
            <Divider type="vertical" />
            <span>
              <ICON_SUCCESS />
              {successRate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return {
    key: id,
    label: header,
    children:
      children &&
      children.map((item) => (
        <div
          className="dis-sb plugin-header-content-style margin-left-50"
          key={item.id}
        >
          <div className="dis-col plugin-child-content-style">
            <p className="plugin-header-label-style">{item.label}</p>
            <p className="text-ellipsis child-desc-style">{item.desc}</p>
            <p>
              {tag.map((item) => (
                <Tag key={item.name}>{item.name}</Tag>
              ))}
              <Popover
                placement="right"
                content={
                  <>
                    <div className="margin-bottom-6">
                      <p className="margin-bottom-6">{item.label}</p>
                      <p
                        className="plugin-header-content-style"
                        style={{ maxWidth: '400px' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    {tag.map((child) => (
                      <div key={child.name} className="margin-bottom-6">
                        <p className="dis-left margin-bottom-6">
                          <span>{child.name}</span>
                          <span className="plugin-header-content-style margin-left-6">
                            {child.type}
                          </span>
                        </p>
                        <p className="plugin-header-content-style">
                          {child.desc}
                        </p>
                      </div>
                    ))}
                  </>
                }
                trigger="hover"
              >
                <Button variant="text" color="primary">
                  参数
                </Button>
              </Popover>
            </p>
            <div className="dis-left">
              <span>
                <ICON_ADJUSTMENT />
                {item.size}
              </span>
              <Divider type="vertical" />
              <span>
                <MessageOutlined />
                {item.cites}
              </span>
              <Divider type="vertical" />
              <span>
                <ClockCircleOutlined />
                {item.time}
              </span>
              <Divider type="vertical" />
              <span>
                <ICON_SUCCESS />
                {item.successRate}
              </span>
            </div>
          </div>
          <Button onClick={() => onAdd(item)}>添加</Button>
        </div>
      )),
  };
};

// 类型保护函数
function isPlugInItem(item: RightContent): item is PlugInItem {
  return (item as PlugInItem).successRate !== undefined;
}

const Content: React.FC<ContentProps> = ({ rightContent, onAdd }) => {
  if (rightContent.length === 0) return null;

  if (isPlugInItem(rightContent[0])) {
    const pluginItems = rightContent as PlugInItem[];
    return (
      <Collapse
        className="collapse-parent-style"
        accordion
        expandIconPosition="end"
        items={pluginItems.map((item) => PlugInOption({ props: item, onAdd }))}
      ></Collapse>
    );
  } else {
    const workflowItems = rightContent as WorkFlowItem[];
    return (
      <div className="dis-col">
        {workflowItems.map((item) => (
          <OptionItem key={item.label} props={item} onAdd={() => onAdd(item)} />
        ))}
      </div>
    );
  }
};

export default React.memo(Content); // 使用 memo 包装以优化性能
