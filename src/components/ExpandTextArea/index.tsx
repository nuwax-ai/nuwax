import PromptEditorWithVariable from '@/components/PromptEditorWithVariable';
import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { InputItemNameEnum } from '@/types/enums/node';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import { PromptEditorProvider } from 'prompt-kit-editor';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import ExpandTextArea from './expandTextarea';
import styles from './index.less';
import { ExpandableInputTextareaProps } from './type';
const cx = classNames.bind(styles);

export const ExpandableInputTextarea: React.FC<
  ExpandableInputTextareaProps
> = ({
  title,
  inputFieldName,
  placeholder,
  // rows = 3,
  onExpand,
  onOptimize,
  onOptimizeClick,
  form,
}) => {
  const [uuid, setUuid] = useState('');
  const { setExpanded, expanded } = useModel('workflow'); // 添加本地状态
  useEffect(() => {
    setUuid(uuidv4());
    return () => {
      setUuid('');
      setExpanded('');
    };
  }, []);

  // 获取输入参数变量数据
  // 注意：useWatch 必须在组件顶层调用，不能在条件中
  const watchedInputArgs = Form.useWatch(InputItemNameEnum.inputArgs, {
    form: form || undefined,
    preserve: true,
  });

  const variables =
    form && watchedInputArgs
      ? watchedInputArgs.filter(
          (item: any) => !['', null, undefined].includes(item.name),
        )
      : [];

  return (
    <div className={cx(styles.container)}>
      <div className="dis-sb margin-bottom">
        {/* 名称 */}
        <span className="node-title-style gap-6 flex items-center">
          {title}
        </span>
        <div>
          {/* 是否有优化 */}
          {onOptimize && onOptimizeClick && (
            <Button
              type="text"
              icon={<ICON_OPTIMIZE />}
              size="small"
              style={{ marginRight: '6px' }}
              onClick={() => onOptimizeClick()}
            />
          )}
          {/* 是否有展开 */}
          {onExpand && (
            <Button
              type="text"
              icon={<ExpandAltOutlined />}
              size="small"
              onClick={() => setExpanded(uuid)}
            />
          )}
        </div>
      </div>
      {/* 输入框 */}
      {/*<Form.Item name={inputFieldName}>*/}
      {/*  <Input.TextArea*/}
      {/*    placeholder={placeholder}*/}
      {/*    autoSize={{ minRows: rows, maxRows: rows }}*/}
      {/*  />*/}
      {/*</Form.Item>*/}

      <PromptEditorProvider>
        <Form.Item name={inputFieldName}>
          <PromptEditorWithVariable
            className={cx(styles['prompt-editor-provider'], 'scroll-container')}
            isControled={true}
            placeholder={placeholder}
            variables={variables}
          />
        </Form.Item>
      </PromptEditorProvider>

      {/* 如果有展开，就要调用展开的组件 */}
      {expanded &&
        expanded === uuid && ( // 使用本地状态控制显示
          <ExpandTextArea
            title={title as string}
            inputFieldName={inputFieldName}
            marginRight={370 + 12 * 2}
            placeholder={placeholder}
            visible={expanded === uuid}
            onClose={() => setExpanded('')}
            form={form}
          />
        )}
    </div>
  );
};

export default ExpandableInputTextarea;
