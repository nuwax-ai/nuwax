import { dict } from '@/services/i18nRuntime';
import { DataTypeEnum } from '@/types/enums/common';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, FormInstance, Popover, Select } from 'antd';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TreeNodeConfig } from '../hooks/useTreeData';

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
  /** 更新节点字段的回调 */
  onChange: (value: TreeNodeConfig[]) => void;
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
  onChange,
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
                        <li>
                          {dict(
                            'PC.Components.FormListItem.outputFormatTextDesc',
                          )}
                        </li>
                        <li>
                          {dict(
                            'PC.Components.FormListItem.outputFormatMarkdownDesc',
                          )}
                        </li>
                        <li>
                          {dict(
                            'PC.Components.FormListItem.outputFormatJsonDesc',
                          )}
                        </li>
                      </ul>
                    }
                  >
                    <InfoCircleOutlined />
                  </Popover>
                  <span className="ml-10">
                    {dict('PC.Components.FormListItem.outputFormat')}
                  </span>
                </div>
              }
              options={[
                {
                  label: dict('PC.Components.FormListItem.outputFormatText'),
                  value: 'Text',
                },
                { label: 'Markdown', value: 'Markdown' },
                { label: 'JSON', value: 'JSON' },
              ]}
              style={{ width: `calc(100% - ${showAddButton ? 34 : 0}px)` }}
              onChange={(e) => {
                form.setFieldValue('outputType', e);
                if (e !== 'JSON') {
                  onChange([
                    {
                      key: uuidv4(),
                      name: 'output',
                      description: dict(
                        'PC.Components.FormListItem.outputResult',
                      ),
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
