import UploadAvatar from '@/components/UploadAvatar';
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
  icon?: string;
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
      label: dict('PC.Pages.UserManage.Index.edit'),
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
          icon: result.data.icon,
          topicUpdated: 1,
        });
        message.success(dict('PC.Toast.Global.modifiedSuccessfully'));

        // 派发自定义更新事件通知列表
        window.dispatchEvent(
          new CustomEvent('conversation-updated', {
            detail: {
              id: conversationInfo.id,
              topic: result.data.topic,
              icon: result.data.icon,
            },
          }),
        );

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

        // 派发自定义删除事件通知列表
        window.dispatchEvent(
          new CustomEvent('conversation-deleted', {
            detail: { id: conversationInfo.id },
          }),
        );

        // 如果是应用智能体模式，同步更新左侧历史会话记录列表
        if (isAppSidebarMode) {
          // 更新所有智能体的历史记录
          runHistory({
            agentId,
            limit: 8,
          });
          navigate(`/app/${agentId}`, { replace: true });
        } else {
          // 如果是会话聊天页（chat页），同步更新左侧历史会话记录列表
          handleUpdateHistory();
          navigate('/home', { replace: true });
        }
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
      form.setFieldsValue({
        topic: cachedConversationInfo.topic,
        icon:
          cachedConversationInfo.icon ||
          cachedConversationInfo.agent?.icon ||
          '',
      });
      setDisabledEdit(true);
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

  const iconValue = Form.useWatch('icon', form);

  const onValuesChange = () => {
    const values = form.getFieldsValue();
    const hasTopicChanged = values.topic !== cachedConversationInfo.topic;
    const currentIcon =
      cachedConversationInfo.icon || cachedConversationInfo.agent?.icon || '';
    const hasIconChanged = values.icon !== currentIcon;

    // 只有名称非空，且（名称发生改变 或 图标发生改变）时才启用保存按钮
    const isTopicValid = values.topic && values.topic.trim() !== '';
    setDisabledEdit(!(isTopicValid && (hasTopicChanged || hasIconChanged)));
  };

  const handleSubmit = async () => {
    const values: FieldType = await form.validateFields();
    try {
      setLoadingEdit(true);
      await runUpdateTopic({
        id: cachedConversationInfo.id,
        topic: values.topic,
        icon: values.icon,
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
        title={dict('PC.Pages.Chat.editConversationInfo')}
        centered
        okButtonProps={{ disabled: disabledEdit, loading: loadingEdit }}
        open={modalOpenEdit}
        onOk={handleSubmit}
        onCancel={() => setModalOpenEdit(false)}
      >
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onValuesChange={onValuesChange}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label={dict('PC.Pages.Chat.conversationIcon')}
            name="icon"
            className={cx(styles['avatar-upload-item'])}
          >
            <UploadAvatar
              imageUrl={iconValue || ''}
              onUploadSuccess={(url) => {
                form.setFieldsValue({ icon: url });
                onValuesChange();
              }}
              svgIconName="icons-common-plus"
            />
          </Form.Item>

          <Form.Item<FieldType>
            label={dict('PC.Pages.Chat.conversationName')}
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
