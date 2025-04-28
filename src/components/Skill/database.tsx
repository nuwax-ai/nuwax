import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { DataTableProps } from '@/types/interfaces/workflow';
import { getImg } from '@/utils/workflow';
import React, { useState } from 'react';
import './index.less';
const DataTable: React.FC<DataTableProps> = ({
  icon,
  name,
  description,
  showParams,
  params,
}) => {
  const [isExpand, setIsExpand] = useState(false); // 控制是否展开的状态
  return (
    <div>
      <div className="skill-item-style background-c9 dis-sb">
        <div className="dis-left">
          <img
            src={
              !icon || icon === '' ? getImg(AgentComponentTypeEnum.Table) : icon
            }
            alt=""
            className="skill-item-icon"
          />
          <div className="skill-item-content-style">
            <div className="skill-item-title-style">{name}</div>
            <div className="skill-item-desc-style">{description}</div>
          </div>
        </div>
      </div>
      {showParams && params && (
        <div>
          {isExpand ? (
            <div className="dis-wrap-sa margin-bottom">
              {params?.map((item) => (
                <div className="database-tag-style" key={item}>
                  {item}
                </div>
              ))}
              <div
                onClick={() => setIsExpand(false)}
                className="database-tag-style cursor-pointer"
              >
                {'收起'}
              </div>
            </div>
          ) : (
            <div className="dis-left">
              <div className="flex-1 dis-left dis-no-wrap">
                {params?.map((item) => (
                  <div className="database-tag-style" key={item}>
                    {item}
                  </div>
                ))}
              </div>
              <div
                onClick={() => setIsExpand(true)}
                className="database-tag-style cursor-pointer"
              >
                ...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
