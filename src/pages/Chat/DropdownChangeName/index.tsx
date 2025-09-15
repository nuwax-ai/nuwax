import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { DeleteOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  Dropdown,
  Form,
  FormProps,
  Input,
  MenuProps,
  message,
  Modal,
  Space,
  Typography,
} from 'antd';
import { ModalFuncProps } from 'antd/es/modal/interface';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel, useNavigate } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface Porps {
  conversationInfo: ConversationInfo;
  setConversationInfo: (value: ConversationInfo) => void;
}

type FieldType = {
  topic?: string;
};

const DropdownChangeName: React.FC<Porps> = ({
  conversationInfo,
  setConversationInfo,
}) => {
  const navigate = useNavigate();
  const { runHistory } = useModel('conversationHistory');

  const [modalOpenEdit, setModalOpenEdit] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [disabledEdit, setDisabledEdit] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const items: MenuProps['items'] = [
    {
      label: '修改名称',
      key: 'edit',
      icon: <EditOutlined />,
    },
    {
      label: '删除',
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  // 删除
  const [modal, contextHolder] = Modal.useModal();

  // 根据用户消息更新会话主题
  const { runAsync: runUpdateTopic } = useRequest(apiAgentConversationUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<ConversationInfo>) => {
      if (result.success) {
        setConversationInfo({
          ...conversationInfo,
          topic: result.data.topic,
        });
        message.success('修改成功');
        // 如果是会话聊天页（chat页），同步更新会话记录
        runHistory({
          agentId: null,
        });
      }
    },
  });

  // 删除会话
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<null>) => {
      if (result.success) {
        message.success('删除成功');
        // 如果是会话聊天页（chat页），同步更新会话记录
        runHistory({
          agentId: null,
        });
        navigate('/', { replace: true });
      }
    },
  });

  const config: ModalFuncProps = {
    title: (
      <Typography>
        <Typography.Title level={5}>永久删除会话</Typography.Title>
      </Typography>
    ),
    icon: null,
    centered: true,
    content: (
      <>
        <Typography>
          <Typography.Text type={'secondary'}>
            本条会话数据将被永久删除,不可恢复及撤销。确定要删除吗?
          </Typography.Text>
        </Typography>
      </>
    ),

    onOk: () => {
      runDel(conversationInfo.id);
    },
  };

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'edit') {
      // 重置表单
      form.resetFields();
      // 填充表单数据
      form.setFieldsValue({ topic: conversationInfo.topic });
      setDisabledEdit(false);
      setModalOpenEdit(true);
      return;
    }
    if (e.key === 'delete') {
      const confirmed = await modal.confirm(config);
      console.log(confirmed);
      return;
    }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const onValuesChange: FormProps<FieldType>['onValuesChange'] = (
    changedValues,
  ) => {
    if (!changedValues.topic) {
      setDisabledEdit(true);
      return;
    }
    setDisabledEdit(changedValues.topic && changedValues.topic.trim() === '');
  };
  const handleSubmit = async () => {
    const values: FieldType = await form.validateFields();
    try {
      setLoadingEdit(true);
      await runUpdateTopic({
        id: conversationInfo.id,
        topic: values.topic,
      });
      setModalOpenEdit(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  return (
    <>
      <Dropdown menu={menuProps}>
        <div className={cx(styles['dropdown-container'])}>
          <Space size={4}>
            {conversationInfo?.id && (
              <>
                {conversationInfo.topic}
                <DownOutlined style={{ fontSize: '12px' }} />
              </>
            )}
          </Space>
        </div>
      </Dropdown>
      <Modal
        title="修改名称"
        centered
        okButtonProps={{ disabled: disabledEdit, loading: loadingEdit }}
        open={modalOpenEdit}
        onOk={handleSubmit}
        onCancel={() => setModalOpenEdit(false)}
      >
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 0 }}
          wrapperCol={{ span: 24 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onValuesChange={onValuesChange}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label=""
            name="topic"
            rules={[
              { required: true, message: '会话名称不能为空' },
              {
                validator: (_, value) => {
                  if (value && value.trim() === '') {
                    return Promise.reject(new Error('会话名称不能只包含空格'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              size="large"
              style={{ marginTop: 10 }}
              placeholder="请输入会话名称"
              showCount
              maxLength={50}
            />
          </Form.Item>
        </Form>
      </Modal>
      {/* 删除 */}
      {contextHolder}
    </>
  );
};

export default DropdownChangeName;
