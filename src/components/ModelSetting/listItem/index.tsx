import type { ModelListItemProps } from '@/types/interfaces/model';
import React from 'react';
// 定义模型列表类
const ModelListItem: React.FC<{ item: ModelListItemProps }> = ({ item }) => {
  const { icon, name, description } = item;
  // let _arr: string[] = [];
  // 如果tagList的长度超过2个,那么获取第三个及以后的标签
  // if (tagList && tagList.length > 2) {
  //   _arr = tagList.slice(2, tagList.length);
  // }

  return (
    <div className="dis-left model-list-item-style">
      {/* 图片 */}
      <img src={icon} alt="" />
      {/* 右侧内容 */}
      <div className="dis-col">
        <div className="dis-left">
          <span className="model-list-item-label">{name}</span>
          {/* {tagList && tagList[0] && <Tag>{tagList[0]}</Tag>}
          {tagList && tagList[1] && <Tag>{tagList[1]}</Tag>} */}
        </div>
        {/* 根据标签来确定后续的显示 */}
        {/* <div className="dis-left divider-text">
          <span>{size}</span>
          <Divider type="vertical" />
          <span>{modelName}</span>
          {_arr.length &&
            _arr.map((item: string) => (
              <div key={item}>
                <Divider type="vertical" />
                <span>{item}</span>
              </div>
            ))}
        </div> */}
        {/* 描述 */}
        <span className="model-list-item-desc text-ellipsis-2">
          {description}
        </span>
      </div>
    </div>
  );
};

export default ModelListItem;
