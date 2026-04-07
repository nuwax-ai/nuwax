import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
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
import React, { useEffect, useState } from 'react';
import { useModel, useNavigate } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface Porps {
  agentId: number;
  /** 会话信息 */
  conversationInfo: ConversationInfo;
  /** 设置会话信息 */
  setConversationInfo: (value: ConversationInfo) => void;
  /** 是否是开放应用智能体会话 */
  isAppSidebarMode?: boolean;
}

type FieldType = {
  topic?: string;
};

const DropdownChangeName: React.FC<Porps> = ({
  agentId,
  conversationInfo,
  setConversationInfo,
  isAppSidebarMode = false,
}) => {
  const navigate = useNavigate();
  const { runHistory, runHistoryItem } = useModel('conversationHistory');

  const [modalOpenEdit, setModalOpenEdit] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [disabledEdit, setDisabledEdit] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [cachedConversationInfo, setCachedConversationInfo] =
    useState<ConversationInfo>(conversationInfo);

  useEffect(() => {
    if (conversationInfo?.id) {
      setCachedConversationInfo(conversationInfo);
    }
  }, [
    conversationInfo?.id,
    conversationInfo?.topic,
    conversationInfo?.topicUpdated,
  ]);

  const items: MenuProps['items'] = [
    {
      label: dict('PC.Pages.Chat.rename'),
      key: 'edit',
      icon: <EditOutlined />,
    },
    {
      label: dict('PC.Common.Global.delete'),
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  // 删除
  const [modal, contextHolder] = Modal.useModal();

  // 更新左侧历史会话记录列表
  const handleUpdateHistory = () => {
    const _agentId = isAppSidebarMode ? agentId : null;
    // 应用智能体模式下，查询当前智能体的8条会话记录，否则查询所有智能体的20条会话记录
    const limit = isAppSidebarMode ? 8 : 5;

    // 更新所有智能体的历史记录
    runHistory({
      agentId: _agentId,
      limit,
    });
  };

  // 根据用户消息更新会话主题
  const { runAsync: runUpdateTopic } = useRequest(apiAgentConversationUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<ConversationInfo>) => {
      if (result.success) {
        setConversationInfo({
          ...conversationInfo,
          topic: result.data.topic,
          topicUpdated: 1,
        });
        message.success(dict('PC.Toast.Global.modifiedSuccessfully'));

        // 更新左侧历史会话记录列表
        handleUpdateHistory();

        // 如果不是应用智能体模式，更新当前智能体的历史记录(用于右侧智能体详情侧边栏中的历史会话列表)
        if (!isAppSidebarMode) {
          // 更新当前智能体的历史记录
          runHistoryItem({
            agentId: result?.data?.agentId,
            limit: 20,
          });
        }
      }
    },
  });

  // 删除会话
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<null>) => {
      if (result.success) {
        message.success(dict('PC.Toast.Global.deletedSuccessfully'));
        // 如果是会话聊天页（chat页），同步更新会话记录
        // runHistory({
        //   agentId: null,
        // });
        // message.success('删除成功');
        // 如果是会话聊天页（chat页），同步更新左侧历史会话记录列表
        handleUpdateHistory();
        navigate('/', { replace: true });
      }
    },
  });

  const config: ModalFuncProps = {
    title: (
      <Typography>
        <Typography.Title level={5}>
          {dict('PC.Pages.Chat.permanentlyDeleteConversation')}
        </Typography.Title>
      </Typography>
    ),
    icon: null,
    centered: true,
    content: (
      <>
        <Typography>
          <Typography.Text type={'secondary'}>
            {dict('PC.Pages.Chat.permanentDeleteWarning')}
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
      form.setFieldsValue({ topic: cachedConversationInfo.topic });
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
        id: cachedConversationInfo.id,
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
            {cachedConversationInfo?.id && (
              <>
                {cachedConversationInfo.topic}
                <DownOutlined style={{ fontSize: '12px' }} />
              </>
            )}
          </Space>
        </div>
      </Dropdown>
      <Modal
        title={dict('PC.Pages.Chat.rename')}
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
              {
                required: true,
                message: dict('PC.Pages.Chat.conversationNameRequired'),
              },
              {
                validator: (_, value) => {
                  if (value && value.trim() === '') {
                    return Promise.reject(
                      new Error(dict('PC.Pages.Chat.conversationNameNoSpaces')),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              size="large"
              style={{ marginTop: 10 }}
              placeholder={dict('PC.Pages.Chat.inputConversationName')}
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
