import CodeEditor from '@/components/CodeEditor';

import { CodeLangEnum } from '@/types/enums/plugin';
import { copyJSONToClipboard } from '@/utils/clipboard';
import { CopyOutlined } from '@ant-design/icons';
import { Button, message, Modal, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import styles from './SeeDetailModal.less';
// 在SeeDetailModal.tsx中
const cx = classNames.bind(styles);

// WebSearchPro弹窗组件，用于展示搜索参数和结果
interface SeeDetailModalProps {
  visible: boolean; // 弹窗是否打开
  onClose: () => void; // 关闭弹窗的回调
  title: string; // 弹窗标题
  data: {
    params: Record<string, any>; // 输入参数
    response: Record<string, any>; // 输出结果
  } | null;
}

const SeeDetailModal: React.FC<SeeDetailModalProps> = ({
  visible,
  onClose,
  data,
  title,
}) => {
  // 复制内容到剪贴板
  const copyToClipboard = useCallback(() => {
    if (!data) return;
    copyJSONToClipboard(data, 2, () => {
      message.success('复制成功');
    });
  }, [data]);

  if (!data || !visible) {
    return null;
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className={cx(styles['see-detail-modal'])}
      destroyOnClose={true}
      // 自定义 header 渲染内容
      title={
        <div className={cx(styles['see-detail-header'])}>
          <div className={cx(styles['see-detail-header-title'])}>{title}</div>
          <div className={cx(styles['see-detail-header-actions'])}>
            <Tooltip title="复制">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={copyToClipboard}
              />
            </Tooltip>
          </div>
        </div>
      }
    >
      <div className={cx(styles['see-detail-content'])}>
        <CodeEditor
          height="400px"
          codeLanguage={CodeLangEnum.JSON}
          value={JSON.stringify(data, null, 2)}
          codeOptimizeVisible={false}
          minimap={false}
          readOnly={true}
          editorOptions={{
            wordWrap: 'bounded',
            wrappingStrategy: 'advanced', // 更智能的换行算法
            wrappingIndent: 'indent', // 换行后保持缩进
            scrollBeyondLastLine: false, // 禁止滚动到空白区域
            minimap: { enabled: false },
          }}
        />
      </div>
    </Modal>
  );
};

export default SeeDetailModal;
