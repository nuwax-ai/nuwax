/**
 * ant design 自定义方法
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Modal } from 'antd';

const { confirm } = Modal;

// modal 确认框
export const modalConfirm = (
  title: string,
  content: string,
  onOk: () => void,
  onCancel?: () => void,
) => {
  confirm({
    title,
    icon: <ExclamationCircleFilled />,
    content,
    okText: '确定',
    maskClosable: true,
    cancelText: '取消',
    onOk,
    onCancel,
  });
};
