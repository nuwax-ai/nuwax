import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
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
        message.success(
          dict('PC.Pages.SpaceKnowledge.DocRename.updateSuccess'),
        );
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
      title={dict('PC.Pages.SpaceKnowledge.DocRename.rename')}
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
                label={dict('PC.Pages.SpaceKnowledge.DocRename.rename')}
                rules={[
                  {
                    required: true,
                    message: dict(
                      'PC.Pages.SpaceKnowledge.DocRename.docNameRequired',
                    ),
                  },
                ]}
              >
                <Input.TextArea
                  className="dispose-textarea-count"
                  placeholder={dict(
                    'PC.Pages.SpaceKnowledge.DocRename.inputDocName',
                  )}
                  maxLength={100}
                  showCount
                  autoSize={{ minRows: 6, maxRows: 8 }}
                />
              </Form.Item>
              <Form.Item className={cx('flex', 'content-end', 'mb-6')}>
                <Button htmlType="submit" type="primary">
                  {dict('PC.Common.Global.confirm')}
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
