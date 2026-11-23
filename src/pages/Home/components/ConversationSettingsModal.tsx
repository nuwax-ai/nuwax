import NewConversationSet from '@/components/NewConversationSet';
import { dict } from '@/services/i18nRuntime';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import { Form, Modal } from 'antd';

interface ConversationSettingsModalProps {
  variables: BindConfigWithSub[];
  onConfirm: (values: Record<string, string | number>) => void;
  onCancel: () => void;
}

const ConversationSettingsModal = ({
  variables,
  onConfirm,
  onCancel,
}: ConversationSettingsModalProps) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open
      title={dict('PC.Components.NewConversationSet.conversationSettings')}
      okText={dict('PC.Components.NewConversationSet.startConversation')}
      cancelText={dict('PC.Common.Global.cancel')}
      maskClosable={false}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <NewConversationSet
        form={form}
        showHeader={false}
        variables={variables}
        onConfirm={onConfirm}
      />
    </Modal>
  );
};

export default ConversationSettingsModal;
