// 定义模型列表
export interface ModelListItemProps {
  // 模型的图标
  icon: string;
  // 模型的名称
  name: string;
  // 生效范围
  scope: string;
  // 模型的简介
  description: string;
  // 值
  id: number;
  // 模型的表示
  model: string;
  // 模型的类型
  type: string;
  // 模型的标签
  tagList?: string[];
  // 模型接口协议
  apiProtocol: 'OpenAI' | 'Ollama';
  // 模型的大小
  size?: string | number;
}

export interface GroupModelItem {
  // 分组的名称
  label: string;
  options: ModelListItemProps[];
}
