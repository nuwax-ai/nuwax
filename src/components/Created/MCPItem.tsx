import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import { DownOutlined } from '@ant-design/icons';
import { Button, Divider } from 'antd';
import React, { useState } from 'react';
import MCPTools from './MCPTools';

interface MCPItemProps {
  item: CreatedNodeItem;
  index: number;
  selected: { key: string };
  onAddNode: (item: CreatedNodeItem) => void;
  addedComponents: AgentAddComponentStatusInfo[];
}
/**
   * 
   * @param item [
  {
    "id": 25,
    "spaceId": 800,
    "creatorId": 1,
    "name": "my-mcp",
    "description": "my-mcp",
    "icon": "https://testagent.xspaceagi.com/api/logo/my-mcp",
    "installType": "COMPONENT",
    "deployStatus": "Deployed",
    "mcpConfig": null,
    "deployedConfig": {
      "serverConfig": null,
      "components": null,
      "tools": [
        {
          "name": "sql_execute_92",
          "description": null,
          "inputArgs": [
            {
              "key": null,
              "name": "sql",
              "description": "SQL语句，可以直接执行且符合业务诉求的SQL语句，符合MySQL语法规范。表结构：CREATE TABLE IF NOT EXISTS `custom_table` (id varchar(255) NOT NULL COMMENT '主键ID',uid varchar(255) NOT NULL COMMENT '用户唯一标识',user_name varchar(255) COMMENT '用户名',nick_name varchar(255) COMMENT '用户昵称',agent_id varchar(255) COMMENT '智能体唯一标识',agent_name varchar(255) COMMENT '智能体名称',created varchar(255) NOT NULL COMMENT '数据创建时间',modified varchar(255) NOT NULL COMMENT '数据修改时间',url varchar(255) COMMENT 'url',content varchar(255) COMMENT '数据内容')",
              "dataType": "String",
              "require": true,
              "subArgs": null,
              "bindValue": null,
              "enums": null
            }
          ],
          "outputArgs": null,
          "jsonSchema": null
        },
        {
          "name": "knowledge_query_222",
          "description": null,
          "inputArgs": [
            {
              "key": null,
              "name": "query",
              "description": "知识库搜索关键词",
              "dataType": "String",
              "require": true,
              "subArgs": null,
              "bindValue": null,
              "enums": null
            },
            {
              "key": null,
              "name": "topK",
              "description": "返回topK条数，默认5",
              "dataType": "Integer",
              "require": false,
              "subArgs": null,
              "bindValue": null,
              "enums": null
            },
            {
              "key": null,
              "name": "rawText",
              "description": "是否返回原始段落",
              "dataType": "Boolean",
              "require": false,
              "subArgs": null,
              "bindValue": null,
              "enums": null
            }
          ],
          "outputArgs": null,
          "jsonSchema": null
        }
      ],
      "resources": [],
      "prompts": []
    },
    "deployed": "2025-06-18T10:47:49.000+00:00",
    "modified": "2025-06-18T10:47:49.000+00:00",
    "created": "2025-06-18T10:47:49.000+00:00",
    "creator": {
      "userId": 1,
      "userName": "fei",
      "nickName": "冯飞",
      "avatar": "https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/8698c0ff6c814ca3b477c4380b0efa5f.jpeg"
    },
    "permissions": [
      "EditOrDeploy",
      "Delete",
      "Stop"
    ]
  }
]
  
* @param index 
* @returns 
*/
const MCPItem: React.FC<MCPItemProps> = ({
  item,
  index,
  selected,
  onAddNode,
  addedComponents,
}) => {
  const [fold, setFold] = useState(false);

  return (
    <>
      <div
        className="dis-sb list-item-style"
        style={{ height: 'unset' }}
        key={`${item.targetId}-${index}`}
      >
        <img
          src={item.icon || getImg(selected.key as AgentComponentTypeEnum)}
          alt=""
          className="left-image-style"
        />
        <div className="flex-1 content-font">
          <p className="label-font-style margin-bottom-6">{item.name}</p>
          <p className="margin-bottom-6 created-description-style">
            {item.description}
          </p>
          <div className="dis-sb count-div-style">
            <div className={'dis-left'}>
              <img
                src={
                  item.publishUser?.avatar ||
                  require('@/assets/images/avatar.png')
                }
                style={{ borderRadius: '50%' }}
                alt="用户头像"
              />
              <span>{item.publishUser?.nickName}</span>
              <Divider type="vertical" />
              <span className="margin-left-6">
                {'部署于'}
                {getTime(item.created!)}
              </span>
            </div>
          </div>
        </div>
        <Button
          type="text"
          size="small"
          icon={
            <DownOutlined
              style={{
                color: '#666',
                fontSize: 16,
                transform: fold ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            />
          }
          style={{ marginRight: 16 }}
          onClick={() => setFold(!fold)}
        />
      </div>
      <MCPTools
        fold={fold}
        tools={item?.config?.tools}
        item={item}
        onAddTool={onAddNode}
        addedComponents={addedComponents}
      />
    </>
  );
};

export default MCPItem;
