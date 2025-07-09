import personalImage from '@/assets/images/personal.png';
import CustomFormModal from '@/components/CustomFormModal';
import { MESSAGE_SCOPE_OPTIONS } from '@/constants/system.constants';
import { apiSystemNotifyMessageSend } from '@/services/systemManage';
import { apiSearchUser } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import { MessageScopeEnum } from '@/types/enums/systemManage';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type { SearchUserInfo } from '@/types/interfaces/teamSetting';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Checkbox,
  Form,
  Input,
  List,
  message,
  Radio,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

const cx = classNames.bind(styles);

export interface MessageSendModalProps {
  //   spaceId: number;
  open: boolean;
  onCancel: () => void;
}

const MessageSendModal: React.FC<MessageSendModalProps> = ({
  open,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [leftColumnMembers, setLeftColumnMembers] = useState<SearchUserInfo[]>(
    [],
  );
  const [leftCheckedMembers, setLeftCheckedMembers] = useState<number[]>([]);
  const [rightColumnMembers, setRightColumnMembers] = useState<
    SearchUserInfo[]
  >([]);
  const [searchedAllMembers, setSearchedAllMembers] = useState<
    SearchUserInfo[]
  >([]);
  // 消息类型
  const [messageScope, setMessageScope] = useState<MessageScopeEnum>(
    MessageScopeEnum.Broadcast,
  );
  // 消息内容
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 发送消息
  const { run: runMessageSend } = useRequest(apiSystemNotifyMessageSend, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('消息发送成功');
      setLoading(false);
      onCancel?.();
    },
    onError: () => {
      setLoading(false);
    },
  });

  const { run: runSearch } = useRequest(apiSearchUser, {
    manual: true,
    debounceWait: 300,
    onSuccess: (data: SearchUserInfo[]) => {
      if (!data?.length) {
        message.warning('未搜索到相关用户');
        setLeftColumnMembers([]);
        return;
      }

      // 遍历 data 数组，为 role 不存在的用户设置默认值
      const updatedData = data.map((m: SearchUserInfo) => {
        // 如果 role 不存在，则设置为默认值 TeamStatusEnum.User
        return { ...m, role: m.role ?? TeamStatusEnum.User };
      });

      // 保留一份搜索结果全数据
      setSearchedAllMembers(updatedData);
      // 排除 rightColumnMembers 中的数据
      const newLeftColumnMembers = updatedData.filter((m: SearchUserInfo) => {
        return !rightColumnMembers.some((r) => r.id === m.id);
      });
      setLeftColumnMembers(newLeftColumnMembers);
    },
  });

  const handlerSubmit = () => {
    if (!content) {
      message.warning('请输入消息内容');
      return;
    }
    if (
      messageScope === MessageScopeEnum.Broadcast &&
      rightColumnMembers.length === 0
    ) {
      message.warning('请选择要添加的成员');
      return;
    }
    setLoading(true);
    const userIds = rightColumnMembers.map((m) => m.id);
    const params = {
      scope: messageScope,
      content,
      userIds,
    };
    runMessageSend(params);
  };

  const handleRemoveMember = (id: number) => {
    // 从 rightColumnMembers 中移除指定 userId 的成员
    const newRightColumnMembers = rightColumnMembers.filter((m) => m.id !== id);
    setRightColumnMembers(newRightColumnMembers);
    // 从 searchedAllMembers 中找到要添加到 leftColumnMembers 的成员
    const removedMember = searchedAllMembers.find((m) => m.id === id);
    if (removedMember) {
      // 复制对象以避免修改
      const copiedMember = { ...removedMember };
      // 将复制后的成员添加到 leftColumnMembers
      setLeftColumnMembers((prev) => [...prev, copiedMember]);
    }
  };
  const handleCheckAllChange = (e: any) => {
    if (e.target.checked) {
      // 将 leftColumnMembers 全部添加到 rightColumnMembers 中
      setRightColumnMembers([...rightColumnMembers, ...leftColumnMembers]);
      // 清空 leftColumnMembers
      setLeftColumnMembers([]);
      // 清空 leftCheckedMembers，将全部的 checkbox 设置为不勾选
      setLeftCheckedMembers([]);
    }
  };

  const handleCheckChange = (checkedValues: number[]) => {
    const newCheckedMembers = leftColumnMembers.filter((m) =>
      checkedValues.includes(m.id),
    );
    setRightColumnMembers([...rightColumnMembers, ...newCheckedMembers]);

    const newLeftColumnMembers = leftColumnMembers.filter(
      (m) => !checkedValues.includes(m.id),
    );
    setLeftColumnMembers(newLeftColumnMembers);
  };

  const handleInputChange = (value: string) => {
    runSearch({
      kw: value || undefined,
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setContent('');
    setMessageScope(MessageScopeEnum.Broadcast);
    setLeftCheckedMembers([]);
    setRightColumnMembers([]);
    setLeftColumnMembers([]);
    setSearchedAllMembers([]);
  }, [open]);

  return (
    <CustomFormModal
      form={form}
      title="添加接受消息用户"
      classNames={{
        content: cx(styles['add-member-modal-content']),
      }}
      open={open}
      okText="发送消息"
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <div className={cx('flex', 'flex-col', 'gap-10')}>
        <Radio.Group
          options={MESSAGE_SCOPE_OPTIONS}
          value={messageScope}
          onChange={(e) => setMessageScope(e.target.value)}
        />

        <Input.TextArea
          placeholder="输入消息内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoSize={{ minRows: 5, maxRows: 6 }}
        />
        {messageScope === MessageScopeEnum.Broadcast && (
          <div style={{ display: 'flex', gap: 20 }}>
            <div className={cx(styles['add-member-left-column'])}>
              <Input
                placeholder="输入用户名、邮箱或手机号码，回车搜索"
                prefix={<SearchOutlined />}
                onPressEnter={(event) => {
                  if (event.key === 'Enter') {
                    handleInputChange(
                      (event.currentTarget as HTMLInputElement).value,
                    );
                  }
                }}
              />
              <Checkbox
                onChange={handleCheckAllChange}
                style={{ marginTop: 20 }}
                checked={
                  leftCheckedMembers.length === leftColumnMembers.length &&
                  leftColumnMembers.length > 0
                }
              >
                全部
              </Checkbox>
              <Checkbox.Group
                style={{ display: 'block', marginTop: 10 }}
                onChange={handleCheckChange}
                value={leftCheckedMembers}
              >
                {leftColumnMembers.map((m) => (
                  <Checkbox key={m.id} value={m.id} className={'flex mb-12'}>
                    <Avatar src={m.avatar || personalImage} /> {m.userName}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            <div style={{ width: '300px' }}>
              <h3 style={{ marginBottom: 15 }}>
                已选成员 ({rightColumnMembers.length})
              </h3>
              <List
                dataSource={rightColumnMembers}
                renderItem={(m) => (
                  <List.Item
                    style={{ borderBlockEnd: 0 }}
                    className="flex items-center gap-10"
                  >
                    <Avatar src={m.avatar || personalImage} />
                    <div className="flex-1 text-ellipsis">{m.userName}</div>
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => handleRemoveMember(m.id)}
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </CustomFormModal>
  );
};

export default MessageSendModal;
