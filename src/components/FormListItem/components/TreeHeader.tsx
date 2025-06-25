import { DataTypeEnum } from '@/types/enums/common';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, FormInstance, Popover, Select } from 'antd';
import React from 'react';

/**
 * 树头部组件的Props接口
 */
interface TreeHeaderProps {
  /** 标题 */
  title?: string;
  /** 表单实例 */
  form: FormInstance;
  /** 是否不显示标题 */
  notShowTitle?: boolean;
  /** 是否显示添加按钮 */
  showAddButton: boolean;
  /** 添加根节点的回调 */
  onAddRoot: () => void;
}

/**
 * 树头部组件
 * 负责渲染树的标题、输出格式选择器和添加按钮
 */
const TreeHeader: React.FC<TreeHeaderProps> = ({
  title,
  form,
  notShowTitle,
  showAddButton,
  onAddRoot,
}) => {
  return (
    <div className="dis-sb margin-bottom">
      <span className="node-title-style">
        <span>{title}</span>
      </span>
      <div>
        {/* 输出格式选择器 */}
        {notShowTitle && (
          <Form.Item name="outputType" noStyle>
            <Select
              prefix={
                <div className="dis-left">
                  <Popover
                    align={{
                      offset: [-12, -12],
                    }}
                    content={
                      <ul>
                        <li>文本: 使用普通文本格式回复</li>
                        <li>Markdown: 将引导模型使用 Markdown 格式输出回复</li>
                        <li>JSON: 将引导模型使用 JSON 格式输出</li>
                      </ul>
                    }
                  >
                    <InfoCircleOutlined />
                  </Popover>
                  <span className="ml-10">输出格式</span>
                </div>
              }
              options={[
                { label: '文本', value: 'Text' },
                { label: 'Markdown', value: 'Markdown' },
                { label: 'JSON', value: 'JSON' },
              ]}
              style={{ width: `calc(100% - ${showAddButton ? 34 : 0}px)` }}
              onChange={(e) => {
                form.setFieldValue('outputType', e);
                if (e !== 'JSON') {
                  form.setFieldValue('outputArgs', [
                    {
                      name: 'output',
                      description: '输出结果',
                      dataType: DataTypeEnum.String,
                      require: false,
                      systemVariable: false,
                      bindValueType: 'Input',
                      bindValue: '',
                    },
                  ]);
                  form.submit();
                }
              }}
            />
          </Form.Item>
        )}

        {/* 添加根节点按钮 */}
        {showAddButton && (
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={onAddRoot}
            className="ml-10"
            type="text"
          />
        )}
      </div>
    </div>
  );
};

export default TreeHeader;
