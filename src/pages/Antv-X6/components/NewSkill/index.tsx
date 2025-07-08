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
import React, { useCallback, useState } from 'react';
import './index.less';
import SettingModal from './SettingModal';
interface TreeOutput extends InputAndOutConfig {
  key: string;
}
const truncate = (str: string, maxLength: number) => {
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
};
// 定义技能的参数展示
const SkillParamsContent: React.FC<{ params: TreeOutput[] }> = ({ params }) => {
  return (
    <div style={{ maxWidth: '300px' }}>
      {(params || []).map((item) => (
        <div key={item.name} style={{ padding: '3px 0' }}>
          <div className="dis-left">
            <span className="mr-16">{truncate(item.name, 30)}</span>
            <Tag color="#C9CDD4">{item.dataType}</Tag>
          </div>
          <p className="skill-params-description">
            {truncate(item.description || '', 70)}
          </p>
        </div>
      ))}
    </div>
  );
};

// 定义通用的技能显示
export const SkillList: React.FC<SkillProps> = ({
  params,
  disabled = false,
  removeItem,
  modifyItem,
  variables = [],
  style,
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
    removeItem(item);
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
    console.log('value:item', item);

    setCurrentComponentInfo({
      ...item,
      inputArgBindConfigs: item.inputArgBindConfigs as InputAndOutConfig[],
    });
    setOpen(true);
  };
  // const { referenceList } = Form.useWatch('referenceList');
  // const variables = Object.values(referenceList.argMap || {});
  const isHoveredItem = (item: CreatedNodeItem) => {
    return (
      currentComponentInfo?.typeId === item.typeId &&
      (currentComponentInfo?.toolName || '') === (item.toolName || '')
    );
  };
  const genKey = useCallback((item: CreatedNodeItem, prefix: string) => {
    return `${prefix}-${item?.type}-${item?.typeId}-${item?.toolName || ''}`;
  }, []);
  return (
    <div className="skill-list" {...(style ? { style } : {})}>
      {params.map((item) => (
        <div key={genKey(item, 'skill')}>
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
            {isHoveredItem(item) && showMask && (
              <div className="mask-layer-style">
                <div
                  className="skill-item-dispose-style"
                  style={{
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    height: '100%',
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '0 10px',
                  }}
                >
                  {item.inputArgBindConfigs &&
                    item.inputArgBindConfigs.length && (
                      <Popover
                        content={
                          <SkillParamsContent
                            params={item.inputArgBindConfigs as TreeOutput[]}
                          />
                        }
                        placement="right"
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
        key={genKey(currentComponentInfo as CreatedNodeItem, 'setting')}
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
