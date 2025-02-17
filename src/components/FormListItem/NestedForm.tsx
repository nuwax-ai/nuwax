import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import { InputAndOutConfig } from '@/types/interfaces/node';
import {
  DeleteOutlined,
  DownOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { Cascader, Checkbox, Input, Popover, Tree } from 'antd';
import { TreeFormProps } from './type';

// 定义 TitleRender 组件，接收额外的 props 用于事件处理
const TitleRender = ({
  inputArgs,
  onInputBlur,
  onDataTypeChange,
  onAddChild,
  onDelete,
}: {
  inputArgs: InputAndOutConfig;
  onInputBlur: (newValue: string) => void;
  onDataTypeChange: (newValue: string[]) => void;
  onAddChild: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="dis-sb">
      <Input
        className="flex-1"
        value={inputArgs.name}
        onBlur={(e) => onInputBlur(e.target.value)}
      />
      <Cascader
        options={dataTypes}
        style={{ width: 100 }}
        value={
          typeof inputArgs.dataType === 'string'
            ? [inputArgs.dataType]
            : inputArgs.dataType
        }
        onChange={onDataTypeChange}
      />
      <div className="dis-left">
        <Popover content={<Input.TextArea />} trigger="click">
          <FileDoneOutlined
            style={{ marginBottom: '14px' }}
            className="margin-right cursor-pointer"
          />
          <Checkbox
            className="margin-right"
            onChange={(e) => {
              console.log(e);
            }}
          />
        </Popover>
        <ICON_ASSOCIATION className="cursor-pointer" onClick={onAddChild} />
        <DeleteOutlined className="cursor-pointer" onClick={onDelete} />
      </div>
    </div>
  );
};

const TreeForm: React.FC<TreeFormProps> = ({
  params,
  handleChangeNodeConfig,
}) => {
  console.log(params);
  // 定义处理输入框和级联选择器变化的回调函数
  const handleInputBlur = (newValue: string) => {
    console.log(newValue);
    // 更新节点名称逻辑
  };

  const handleDataTypeChange = (newValue: string[]) => {
    console.log(newValue);
    // 更新数据类型逻辑
  };

  const handleAddChild = (nodeData: InputAndOutConfig) => {
    let _arr;
    if (!nodeData.subArgs) {
      _arr = [
        {
          name: '',
          dataType: '',
          bindValue: '',
          key: '0',
          description: '',
          require: false,
          systemVariable: false,
          bindValueType: '',
        },
      ];
    } else {
      _arr = [
        ...nodeData.subArgs,
        {
          name: '',
          dataType: '',
          bindValue: '',
          key: nodeData.subArgs.length.toString(),
          description: '',
          require: false,
          systemVariable: false,
          bindValueType: '',
        },
      ];
    }
    // 添加子节点逻辑
    handleChangeNodeConfig({
      ...params,
      inputArgs: _arr,
    });
  };

  const handleDelete = (nodeData: InputAndOutConfig) => {
    console.log('Deleting node:', nodeData.name);
    // 删除节点逻辑
    // 这里需要根据实际情况来决定如何删除节点，可能是通过过滤父节点的subArgs数组
  };

  return (
    <Tree
      showLine
      defaultExpandAll
      switcherIcon={<DownOutlined />}
      treeData={params.inputArgs || []}
      fieldNames={{ title: 'name', key: 'bindValue', children: 'subArgs' }}
      titleRender={(nodeData) => (
        <TitleRender
          inputArgs={nodeData}
          onInputBlur={handleInputBlur}
          onDataTypeChange={handleDataTypeChange}
          onAddChild={() => handleAddChild(nodeData)}
          onDelete={() => handleDelete(nodeData)}
        />
      )}
    ></Tree>
  );
};

export default TreeForm;
