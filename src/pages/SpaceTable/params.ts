export const mockColumns = [
  {
    title: '字段名',
    dataIndex: 'fieldName',
    type: 'text' as const,
    editable: true,
    width: 160,
  },
  {
    title: '字段详细描述',
    dataIndex: 'fieldDescription',
    type: 'text' as const,
    editable: true,
    edit: true,
    width: 180,
  },
  {
    title: '参数类型',
    dataIndex: 'fieldType',
    type: 'select' as const,
    editable: true,
    width: 140,
    options: [
      { label: 'String', value: 1 },
      { label: 'Integer', value: 2 },
      { label: 'Number', value: 3 },
      { label: 'Boolean', value: 4 },
      { label: 'Date', value: 5 },
    ],
    map: {
      1: 'String',
      2: 'Integer',
      3: 'Number',
      4: 'boolean',
      5: 'Date',
      6: 'Number',
      7: 'String',
    },
  },
  {
    title: '数据长度',
    dataIndex: 'dataLength',
    type: 'select' as const,
    editable: true,
    width: 180,
    shouldUpdate: {
      name: 'fieldType', // 依赖的字段名
      value: 1, // 当依赖字段的值为1时，才显示该men
    },
    options: [
      { label: '短文本（0-255）', value: 1 },
      { label: '长文本（0-16M）', value: 7 },
    ],
    map: {
      1: '短文本（0-255）',
      2: '--',
      3: '--',
      4: '--',
      5: '--',
      6: '--',
      7: '长文本（0-16M）',
    },
    placeholder: '参数类型为string才会生效',
  },
  {
    title: '是否必须',
    dataIndex: 'nullableFlag',
    type: 'checkbox' as const,
    editable: true,
    edit: true,
    width: 140,
  },
  {
    title: '是否唯一',
    dataIndex: 'uniqueFlag',
    type: 'checkbox' as const,
    editable: true,
    width: 140,
  },
  {
    title: '是否启用',
    dataIndex: 'enabledFlag',
    type: 'checkbox' as const,
    editable: true,
    edit: true,
    width: 140,
  },
  {
    title: '默认值',
    dataIndex: 'defaultValue',
    type: 'text' as const,
    editable: true,
    edit: true,
    defaultValue: '系统变量',
    shouldUpdate: {
      name: 'fieldType', // 依赖的字段名
    },
  },
];

export const mockTableData = [
  {
    name: 'uid',
    description: '用户唯一标识',
    type: 'string',
    require: true,
    only: false,
    isShow: true,
    defaultValue: '系统变量',
    id: 1,
  },
  {
    name: 'u2d',
    description: '用户唯2标识',
    type: 'string',
    require: false,
    only: false,
    isShow: false,
    defaultValue: '系统变量',
    id: 2,
  },
];

export const AddParams = [
  {
    label: '字段名称',
    dataIndex: 'name',
    type: 'Input',
    rules: [{ required: true, message: '请输入字段名称' }],
  },
  {
    label: '字段值',
    dataIndex: 'value',
    type: 'Input',
    rules: [{ required: true, message: '请输入字段值' }],
  },
  {
    label: '字段展示类型',
    dataIndex: 'type',
    type: 'Select',
    options: [
      { label: '字符串', value: 'Input' },
      { label: '复选框', value: 'Checkbox' },
      { label: '单选框', value: 'Radio' },
      { label: '选择框', value: 'Select' },
      { label: '时间选择器', value: 'DatePicker' },
      { label: '时间范围选择', value: 'RangePicker' },
    ],
    rules: [{ required: true, message: '请选择字段展示类型' }],
  },
  {
    label: '字段排序',
    dataIndex: 'sort',
    type: 'Input',
  },
  {
    label: '字段描述',
    dataIndex: 'description',
    type: 'TextArea',
  },
];

export const typeMap: Record<number, string> = {
  1: 'TextArea',
  2: 'Number',
  3: 'Number',
  4: 'Radio',
  5: 'DatePicker',
  7: 'TextArea',
};
