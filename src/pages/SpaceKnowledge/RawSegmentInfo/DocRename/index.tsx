import TooltipIcon from '@/components/TooltipIcon';
import { apiKnowledgeDocumentUpdateDocName } from '@/services/knowledge';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { KnowledgeDocumentUpdateDocNameParams } from '@/types/interfaces/knowledge';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { FormOutlined } from '@ant-design/icons';
import { Button, Form, FormProps, Input, message, Popover } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface DocRenameProps {
  docId?: number;
  docName?: string;
  onSuccessUpdateName: (docId: number, name: string) => void;
}

const DocRename: React.FC<DocRenameProps> = ({
  docId,
  docName,
  onSuccessUpdateName,
}) => {
  const [form] = Form.useForm();
  const [hovered, setHovered] = useState<boolean>(false);

  // 知识库文档配置 - 更改文件名称
  const { run: runUpdateDocName } = useRequest(
    apiKnowledgeDocumentUpdateDocName,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (_: null, params: KnowledgeDocumentUpdateDocNameParams[]) => {
        message.success('更新成功');
        setHovered(false);
        const { docId, name } = params[0];
        onSuccessUpdateName(docId, name);
      },
    },
  );

  useEffect(() => {
    if (hovered) {
      form.setFieldValue('name', docName);
    }
  }, [docName, hovered]);

  const onFinish: FormProps<{
    name: string;
  }>['onFinish'] = (values) => {
    const { name } = values;
    runUpdateDocName({
      docId,
      name,
    });
  };

  return (
    <TooltipIcon
      title="重命名"
      type={TooltipTitleTypeEnum.Blank}
      icon={
        <Popover
          arrow={false}
          trigger="click"
          open={hovered}
          onOpenChange={setHovered}
          placement="bottom"
          content={
            <Form
              form={form}
              layout="vertical"
              requiredMark={customizeRequiredNoStarMark}
              onFinish={onFinish}
            >
              <Form.Item
                className={cx(styles.input, 'mb-16')}
                name="name"
                label="重命名"
                rules={[
                  {
                    required: true,
                    message: '文档名称不能为空',
                  },
                ]}
              >
                <Input.TextArea
                  className="dispose-textarea-count"
                  placeholder={'请输入文档名称'}
                  maxLength={100}
                  showCount
                  autoSize={{ minRows: 6, maxRows: 8 }}
                />
              </Form.Item>
              <Form.Item className={cx('flex', 'content-end', 'mb-6')}>
                <Button htmlType="submit" type="primary">
                  确认
                </Button>
              </Form.Item>
            </Form>
          }
        >
          <FormOutlined className={cx('cursor-pointer')} />
        </Popover>
      }
    />
  );
};

export default DocRename;
