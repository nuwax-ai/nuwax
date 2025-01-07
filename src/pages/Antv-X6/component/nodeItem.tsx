// 这个页面定义普通的节点，如输入，输出，等
import { Cascader, Input } from 'antd';
import { dataTypes, modelTypes } from '../params';
import { CommonInput, InputAndOut } from './commonNode';
// 定义开始节点
// 定义开始节点的渲染逻辑
const StartNode: React.FC = () => {
  const fieldConfigs = [
    {
      name: 'name',
      placeholder: '变量名',
      label: '变量名',
      rules: [{ required: true, message: '请输入变量名' }],
      component: Input,
      style: { width: '140px' },
    },
    {
      name: 'type',
      placeholder: '选择类型',
      label: '变量类型',
      rules: [{ required: true, message: '请选择变量类型' }],
      component: Cascader,
      style: { width: '100px' },
      props: { options: dataTypes }, // 传递特定于 Cascader 的属性
    },
  ];

  return (
    <InputAndOut
      title="输入"
      fieldConfigs={fieldConfigs}
      initialValues={{ inputItems: [{ name: '', type: '', isSelect: true }] }}
      showCheckbox={true}
      showCopy={true}
      showAssociation={true}
    />
  );
};

// 定义结束的节点渲染
const EndNode: React.FC = () => {
  const fieldConfigs = [
    {
      name: 'name',
      placeholder: '参数名',
      label: '参数名',
      rules: [{ required: true, message: '请输入参数名' }],
      component: Input,
    },
    {
      name: 'value',
      placeholder: '参数值',
      label: '参数值',
      rules: [{ required: true, message: '请输入参数值' }],
      component: CommonInput,
      style: { flex: '0 0 50%' },
      props: { options: modelTypes },
    },
  ];

  return (
    <InputAndOut
      title="输出变量"
      fieldConfigs={fieldConfigs}
      showCopy={true}
      initialValues={{ inputItems: [{ name: '', value: '', isSelect: true }] }}
    />
  );
};
export default { StartNode, EndNode };
