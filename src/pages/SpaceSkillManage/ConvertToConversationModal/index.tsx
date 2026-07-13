import CustomFormModal from '@/components/CustomFormModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetUserSelectableSandboxList } from '@/services/systemManage';
import { Form, Select, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ComputerOption {
  id: string;
  name: string;
}

interface ConvertToConversationModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (sandboxId: string) => Promise<void>;
}

/**
 * 转为对话式开发模态框
 * 允许用户选择电脑，选择后触发回调以进入对话式开发
 */
const ConvertToConversationModal: React.FC<ConvertToConversationModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingComputers, setLoadingComputers] = useState(false);
  const [computerList, setComputerList] = useState<ComputerOption[]>([]);

  // 获取电脑列表
  const fetchComputerList = async () => {
    setLoadingComputers(true);
    try {
      const res = await apiGetUserSelectableSandboxList();
      if (res.code === SUCCESS_CODE && res.data) {
        const { sandboxes } = res.data;
        const list = (sandboxes || []).map((item) => ({
          id: String(item.sandboxId),
          name: item.name,
        }));
        setComputerList(list);
      }
    } catch (error) {
      console.error('Failed to fetch computer list:', error);
      message.error(
        dict(
          'PC.Pages.SpaceSkillManage.ConvertToConversationModal.computerLoadFailed',
        ) || '加载电脑列表失败',
      );
    } finally {
      setLoadingComputers(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
      setLoading(false);
      fetchComputerList();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onConfirm(values.sandboxId);
    } catch (error) {
      console.error('Submit validation failed or confirm failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomFormModal
      title={dict('PC.Pages.SpaceSkillManage.ConvertToConversationModal.title')}
      open={open}
      form={form}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handleSubmit}
    >
      <div className={cx(styles['convert-modal-container'])}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="sandboxId"
            label={dict(
              'PC.Pages.SpaceSkillManage.ConvertToConversationModal.selectComputer',
            )}
            className={cx(styles['modal-form-item'])}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.SpaceSkillManage.ConvertToConversationModal.computerRequired',
                ),
              },
            ]}
          >
            <Select
              placeholder={dict(
                'PC.Pages.SpaceSkillManage.ConvertToConversationModal.computerPlaceholder',
              )}
              loading={loadingComputers}
              disabled={loading}
            >
              {computerList.map((comp) => (
                <Select.Option key={comp.id} value={comp.id}>
                  {comp.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </div>
    </CustomFormModal>
  );
};

export default ConvertToConversationModal;
