import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { ExpandAltOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Input } from 'antd';
import React, { useState } from 'react';
import '../index.less';
import { InputConfigs, outPutConfigs } from '../params';
import { NodeDisposeProps } from '../type';
import { InputAndOut, ModelSelect } from './commonNode';

// 定义大模型节点
const ModelNode: React.FC<NodeDisposeProps> = ({ groupedOptionsData }) => {
  // 三个值(随机性，top，最大回复长度)
  const [value, setValue] = useState({
    top: 0,
    reply: 0,
    random: 0,
  });
  //   修改上述三个值
  const handleModelSetValue = (newSettings: typeof value) => {
    setValue(newSettings);
  };

  const settings = {
    value: value,
    onChange: handleModelSetValue,
  };

  //   选择模型的
  const [selectModel, setSelectModel] = useState('');
  //   跟换选中的模型
  const changeModel = (newModel: typeof selectModel) => {
    setSelectModel(newModel);
  };
  console.log(groupedOptionsData);
  const groupModelList = {
    value: selectModel,
    onChange: changeModel,
    groupedOptionsData: groupedOptionsData,
  };

  //   显示新增技能
  const showAdd = () => {
    console.log('showAdd');
  };

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelect settings={settings} groupModelList={groupModelList} />
      {/* 技能模块 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">技能</span>
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={showAdd}
          ></Button>
        </div>
        <Empty />
      </div>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
      {/* 系统提示词 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">系统提示词</span>
          <div>
            <ExpandAltOutlined />
            <ICON_OPTIMIZE style={{ marginLeft: '10px' }} />
          </div>
        </div>
        <Input.TextArea
          placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
          autoSize={{ minRows: 3, maxRows: 5 }}
          style={{ marginBottom: '10px' }}
        />
      </div>
      {/* 用户提示词 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">用户提示词</span>
          <div>
            <ExpandAltOutlined />
          </div>
        </div>
        <Input.TextArea
          placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
          autoSize={{ minRows: 3, maxRows: 5 }}
          style={{ marginBottom: '10px' }}
        />
      </div>
      {/* 输出参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输出"
          fieldConfigs={InputConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
    </div>
  );
};

// 定义意图识别

export default { ModelNode };
