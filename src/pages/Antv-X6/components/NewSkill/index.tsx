import type {
  BindConfigWithSub,
  CreatedNodeItem,
} from '@/types/interfaces/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { SkillProps } from '@/types/interfaces/workflow';
import { getImg } from '@/utils/workflow';
import {
  DeleteOutlined,
  // DownOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Popover, Tag } from 'antd';
import React, { useState } from 'react';
import { useModel } from 'umi';
import './index.less';
import SettingModal from './SettingModal';
interface TreeOutput extends InputAndOutConfig {
  key: string;
}

// 定义技能的参数展示
const SkillParamsContent: React.FC<{ params: TreeOutput[] }> = ({ params }) => {
  return (
    <>
      {(params || []).map((item) => (
        <div key={item.name}>
          <div className="dis-left">
            <span className="mr-16">{item.name}</span>
            <Tag color="#C9CDD4">{item.dataType}</Tag>
          </div>
          <p className="skill-params-description">{item.description}</p>
        </div>
      ))}
    </>
  );
};

// 定义通用的技能显示
export const SkillList: React.FC<SkillProps> = ({
  params,
  disabled = false,
  removeItem,
  modifyItem,
}) => {
  // const [skillParams,setSkillParams] = useState<NodeConfig>(params);
  // 使用useState钩子来管理每个项目的hover状态
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<CreatedNodeItem | null>(null);

  // 打开技能配置的数据
  const [open, setOpen] = useState(false);
  // 新增一个状态来控制蒙版层的显示
  const [showMask, setShowMask] = useState(false);

  // 移除技能
  const handleDelete = (item: CreatedNodeItem) => {
    // let newParams;
    // if (item.knowledgeBaseId) {
    //   newParams = params.filter(
    //     (i) => i.knowledgeBaseId !== item.knowledgeBaseId,
    //   );
    // } else {
    //   newParams = params.filter((i) => i.typeId !== item.typeId);
    // }
    removeItem(item);
    // form.setFieldValue(skillName, newParams);

    // setIsModified(true);
  };

  const handleOnSave = (val: { [key: string]: BindConfigWithSub[] }) => {
    modifyItem({
      ...(currentComponentInfo as CreatedNodeItem),
      inputArgBindConfigs: val.inputArgBindConfigs as InputAndOutConfig[],
    });
    setOpen(false);
    setCurrentComponentInfo(null);
  };
  const handleEdit = (item: CreatedNodeItem) => {
    setCurrentComponentInfo({
      ...item,
      inputArgBindConfigs: item.inputArgBindConfigs as InputAndOutConfig[],
    });
    setOpen(true);
  };
  const { referenceList } = useModel('workflow');
  const variables = Object.values(referenceList.argMap || {});
  console.log(referenceList);
  return (
    <div className="skill-list">
      {params.map((item) => (
        <div key={`skill-${item.type}-${item.targetId}-${item.toolName}`}>
          <div
            className="skill-item-style dis-left"
            style={{
              //设置为整体为灰色
              opacity: disabled ? 0.5 : 1,
              //设置为不可点击
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={() => {
              setCurrentComponentInfo(item);
              setShowMask(true);
            }}
            onMouseLeave={() => setShowMask(false)}
          >
            <img
              src={item.icon || getImg(item.targetType)}
              alt=""
              className="skill-item-icon"
            />
            <div className="skill-item-content-style">
              <div className="skill-item-title-style">{item.name}</div>
              <div className="skill-item-desc-style">{item.description}</div>
            </div>
            {currentComponentInfo?.typeId === item.typeId && showMask && (
              <div className="mask-layer-style">
                <div
                  className="skill-item-dispose-style"
                  style={{ color: '#fff', backgroundColor: 'transparent' }}
                >
                  {item.outputArgBindConfigs &&
                    item.outputArgBindConfigs.length && (
                      <Popover
                        content={
                          <SkillParamsContent
                            params={item.outputArgBindConfigs as TreeOutput[]}
                          />
                        }
                        trigger="hover"
                      >
                        <InfoCircleOutlined className="white" />
                      </Popover>
                    )}
                  <Popover content={'编辑参数'} trigger="hover">
                    <SettingOutlined
                      className="ml-12 cursor-pointer white"
                      onClick={() => {
                        handleEdit(item);
                        setOpen(true);
                      }}
                    />
                  </Popover>
                  {!disabled && (
                    <Popover content={'移除'} trigger="hover">
                      <DeleteOutlined
                        className="ml-12  white"
                        onClick={() => handleDelete(item)}
                      />
                    </Popover>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <SettingModal
        open={open}
        variables={variables}
        inputArgBindConfigs={
          currentComponentInfo?.inputArgBindConfigs as BindConfigWithSub[]
        }
        onSave={handleOnSave}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
};
