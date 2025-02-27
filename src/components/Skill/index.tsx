import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { SkillDisposeProps, SkillProps } from '@/types/interfaces/workflow';
import { getImg } from '@/utils/workflow';
import {
  DeleteOutlined,
  DownOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Input, Modal, Popover, Switch, Tag, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import './index.less';
interface TreeOutput extends InputAndOutConfig {
  key: string;
}
// 定义技能的参数展示
const SkillParamsContent: React.FC<{ params: TreeOutput[] }> = ({ params }) => {
  return (
    <>
      {params.map((item) => (
        <div key={item.name}>
          <div className="dis-left">
            <span className="mr-16">{item.name}</span>
            <Tag>{item.dataType}</Tag>
          </div>
          <p className="skill-params-description">{item.description}</p>
        </div>
      ))}
    </>
  );
};

// 定义技能列表的设置参数的弹窗
export const SkillDispose: React.FC<SkillDisposeProps> = ({
  open,
  onCancel,
  params,
  onConfirm,
}) => {
  const [selectMenu, setSelectMenu] = useState('input');

  const [parameter, setParameter] = useState(params);
  const handleOk = () => {
    onConfirm(parameter);
    onCancel();
  };

  useEffect(() => {
    setParameter(params);
  }, [params.inputArgBindConfigs]);
  const handleChangeValue = (updatedParam: InputAndOutConfig, type: string) => {
    if (type === 'input') {
      setParameter((prev) => ({
        ...prev,
        inputArgBindConfigs: prev.inputArgBindConfigs?.map((item) =>
          item.name === updatedParam.name ? updatedParam : item,
        ),
      }));
    } else {
      setParameter((prev) => ({
        ...prev,
        outputArgBindConfigs: prev.outputArgBindConfigs?.map((item) =>
          item.name === updatedParam.name ? updatedParam : item,
        ),
      }));
    }
  };

  return (
    <Modal
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      open={open}
      centered
      onCancel={() => onCancel()}
      className="skill-dispose-modal-style"
      width={800}
      footer={() => <Button onClick={handleOk}>保存</Button>}
    >
      <div className="skill-dispose-container flex ">
        {/* 左侧部分 */}
        <div className="skill-dispose-left">
          <div className="skill-dispose-left-title">设置</div>
          <p
            className={`skill-menu-style ${
              selectMenu === 'input' ? 'select-menu' : ''
            }`}
            onClick={() => setSelectMenu('input')}
          >
            配置输入参数
          </p>
          <p
            className={`skill-menu-style ${
              selectMenu === 'output' ? 'select-menu' : ''
            }`}
            onClick={() => setSelectMenu('output')}
          >
            配置输出参数
          </p>
        </div>
        {/* 右侧部分 */}
        <div className="skill-dispose-right">
          {selectMenu === 'input' && (
            <div>
              <div className="dis-sb content-item-style content-title-style">
                <span className="flex-1">参数名称</span>
                <span className="content-center-item-style">默认值</span>
                <p className="content-right-item-style flex">
                  <span>开启</span>
                  <Popover
                    content={
                      '当参数设置为不可见时，大模型将无法看到该参数。如果该参数设置了默认值并且不可见，则在调用插件时，智能体会默认只使用这个设定值'
                    }
                    overlayInnerStyle={{ width: '300px' }}
                  >
                    <InfoCircleOutlined className="ml-12" />
                  </Popover>
                </p>
              </div>
              {parameter.inputArgBindConfigs?.map((item) => (
                <div className="dis-sb content-item-style" key={item.name}>
                  <div className="flex-1">
                    <p className="flex">
                      <span className="mr-16">{item.name}</span>
                      <Tag>{item.dataType}</Tag>
                    </p>
                    <p>{item.description}</p>
                  </div>
                  <Input
                    className="content-center-item-style"
                    value={item.bindValue ?? ''}
                    onChange={(e) => {
                      handleChangeValue(
                        {
                          ...item,
                          bindValue: e.target.value, // 创建新对象
                        },
                        'input',
                      );
                    }}
                  ></Input>
                  <p className="content-right-item-style">
                    <Switch
                      size="small"
                      checked={item.enable}
                      onChange={(checked) => {
                        handleChangeValue(
                          {
                            ...item,
                            enable: checked, // 创建新对象
                          },
                          'input',
                        );
                      }}
                    />
                  </p>
                </div>
              ))}
            </div>
          )}

          {selectMenu === 'output' && (
            <>
              <p className="skill-menu-style content-title-style output-style">
                输出变量
              </p>
              {/* <Input value={params.bindValueType}></Input> */}
              <p className="output-remark-style">
                当参数设置为不可见时，大模型将无法看到该参数。如果该参数设置了默认值并且不可见，则在调用插件时，智能体会默认只使用这个设定值
              </p>
              <div className="dis-sb">
                <span>参数名称</span>
                <p className="content-right-item-style flex">
                  <span>开启</span>
                  <Popover
                    content={'当设置为不可见时，该参数将不会返回给大模型'}
                    overlayInnerStyle={{ width: '300px' }}
                  >
                    <InfoCircleOutlined className="ml-12" />
                  </Popover>
                </p>
              </div>
              <Tree<TreeOutput>
                showLine
                defaultExpandAll
                switcherIcon={<DownOutlined />}
                fieldNames={{ title: 'name', key: 'name', children: 'subArgs' }}
                treeData={parameter.outputArgBindConfigs as TreeOutput[]}
                titleRender={(nodeData) => {
                  console.log(nodeData);
                  return (
                    <div className="dis-sb tree-title-style">
                      <div>
                        <span>{nodeData.name}</span>
                        <Tag className="ml-12">{nodeData.dataType}</Tag>
                      </div>
                      <Switch
                        size="small"
                        checked={nodeData.enable}
                        onChange={(checked) => {
                          handleChangeValue(
                            {
                              ...nodeData,
                              enable: checked, // 创建新对象
                            },
                            'output',
                          );
                        }}
                      />
                    </div>
                  );
                }}
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

// 定义通用的技能显示
export const SkillList: React.FC<SkillProps> = ({ params, handleChange }) => {
  // 使用useState钩子来管理每个项目的hover状态
  const [hoveredItem, setHoveredItem] = useState<CreatedNodeItem>({
    icon: '',
    name: '',
    description: '',
    statistics: null,
    targetId: 0,
    targetType: '0',
    type: AgentComponentTypeEnum.Plugin,
  });

  // 打开技能配置的数据
  const [open, setOpen] = useState(false);
  // 新增一个状态来控制蒙版层的显示
  const [showMask, setShowMask] = useState(false);

  // 移除技能
  const handleDelete = (item: CreatedNodeItem) => {
    const newParams = {
      ...params,
      skillComponentConfigs: params.skillComponentConfigs?.filter(
        (i) => i.typeId !== item.typeId,
      ),
    };
    handleChange(newParams);
  };

  const handleConfirm = (val: CreatedNodeItem) => {
    const newParams = params.skillComponentConfigs?.map((item) =>
      item.typeId === val.typeId ? val : item,
    );
    handleChange({ ...params, skillComponentConfigs: newParams });
  };

  return (
    <>
      {params.skillComponentConfigs?.map((item) => (
        <div
          className="skill-item-style dis-left"
          key={item.typeId}
          onMouseEnter={() => {
            setHoveredItem(item);
            setShowMask(true);
          }}
          onMouseLeave={() => setShowMask(false)}
        >
          <img
            src={item.icon || getImg(item.type)}
            alt=""
            className="skill-item-icon"
          />
          <div className="skill-item-content-style">
            <div className="skill-item-title-style">{item.name}</div>
            <div className="skill-item-desc-style">{item.description}</div>
          </div>
          {hoveredItem?.typeId === item.typeId && showMask && (
            <div className="mask-layer-style" style={{}}>
              <div
                className="skill-item-dispose-style"
                style={{ color: '#fff', backgroundColor: 'transparent' }}
              >
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
                <Popover content={'编辑参数'} trigger="hover">
                  <SettingOutlined
                    className="ml-12 cursor-pointer white"
                    onClick={() => {
                      setHoveredItem(item);
                      setOpen(true);
                    }}
                  />
                </Popover>
                <Popover content={'移除'} trigger="hover">
                  <DeleteOutlined
                    className="ml-12  white"
                    onClick={() => handleDelete(item)}
                  />
                </Popover>
              </div>
            </div>
          )}
        </div>
      ))}
      <SkillDispose
        open={open}
        onCancel={() => setOpen(false)}
        params={hoveredItem}
        onConfirm={handleConfirm}
      />
    </>
  );
};
