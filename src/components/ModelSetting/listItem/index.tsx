import { Divider, Tag } from 'antd';
import React from 'react';
import type { ModelListItemProps } from '../type';
// 定义模型列表类
const ModelListItem: React.FC<ModelListItemProps> = ({
  icon,
  label,
  size,
  modelName,
  desc,
  tagList,
}) => {
  let _arr: string[] = [];
  // 如果tagList的长度超过2个,那么获取第三个及以后的标签
  if (tagList && tagList.length > 2) {
    _arr = tagList.slice(2, tagList.length);
  }

  return (
    <div className="dis-left model-list-item-style">
      {/* 图片 */}
      {icon}
      {/* 右侧内容 */}
      <div className="dis-col">
        <div className="dis-left">
          <span className="model-list-item-label">{label}</span>
          {tagList && tagList[0] && <Tag>{tagList[0]}</Tag>}
          {tagList && tagList[1] && <Tag>{tagList[1]}</Tag>}
        </div>
        <div className="dis-left divider-text">
          <span>{size}</span>
          <Divider type="vertical" />
          <span>{modelName}</span>
          {/* 根据标签来确定后续的显示 */}
          {_arr.length &&
            _arr.map((item: string) => (
              <div key={item}>
                <Divider type="vertical" />
                <span>{item}</span>
              </div>
            ))}
        </div>
        {/* 描述 */}
        <span className="model-list-item-desc">{desc}</span>
      </div>
    </div>
  );
};

export default ModelListItem;
