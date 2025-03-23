import personalImage from '@/assets/images/personal.png';
import CustomFormModal from '@/components/CustomFormModal';
import { apiAddSpaceMember, apiGetSpaceUserList } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type { SpaceUserInfo } from '@/types/interfaces/teamSetting';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  Avatar,
  Button,
  Checkbox,
  Form,
  Input,
  List,
  message,
  Select,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

const cx = classNames.bind(styles);

export interface AddMemberProps {
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  onConfirmAdd?: () => void;
}

const selectOptions = [
  { value: TeamStatusEnum.Owner, label: '创建人' },
  { value: TeamStatusEnum.Admin, label: '管理员' },
  { value: TeamStatusEnum.User, label: '成员' },
];

const AddMember: React.FC<AddMemberProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirmAdd,
}) => {
  const [form] = Form.useForm();
  const [fullMembers, setFullMembers] = useState<SpaceUserInfo[]>([]);
  const [leftColumnMembers, setLeftColumnMembers] = useState<SpaceUserInfo[]>(
    [],
  );
  const [leftCheckedMembers, setLeftCheckedMembers] = useState<number[]>([]);
  const [rightColumnMembers, setRightColumnMembers] = useState<SpaceUserInfo[]>(
    [],
  );

  const cancelModal = () => {
    onCancel();
  };

  const { run } = useRequest(apiGetSpaceUserList, {
    manual: true,
    onSuccess(data) {
      setLeftColumnMembers(JSON.parse(JSON.stringify(data.data)));
      setFullMembers(JSON.parse(JSON.stringify(data.data)));
    },
  });

  const { run: runAdd } = useRequest(apiAddSpaceMember, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('添加成功');
      onConfirmAdd?.();
    },
  });

  const handlerSubmit = () => {
    if (rightColumnMembers.length === 0) {
      message.warning('请选择要添加的成员');
      return;
    }
    const params = rightColumnMembers.map((m) => ({
      spaceId,
      userId: m.userId,
      role: m.role,
    }));
    runAdd(params);
  };

  const handleRoleChange = (userId: number, role: TeamStatusEnum) => {
    // 创建一个新的 rightColumnMembers 数组，避免直接修改原对象
    const newRightColumnMembers = rightColumnMembers.map((m) => {
      if (m.userId === userId) {
        // 复制对象并更新角色
        return { ...m, role };
      }
      return m;
    });
    setRightColumnMembers(newRightColumnMembers);
  };
  const handleRemoveMember = (userId: number) => {
    // 从 rightColumnMembers 中移除指定 userId 的成员
    const newRightColumnMembers = rightColumnMembers.filter(
      (m) => m.userId !== userId,
    );
    setRightColumnMembers(newRightColumnMembers);
    // 从 fullMembers 中找到要添加到 leftColumnMembers 的成员
    const removedMember = fullMembers.find((m) => m.userId === userId);
    if (removedMember) {
      // 复制对象以避免修改 fullMembers
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
    // 过滤掉 checkedValues 中包含的 userId 对应的成员
    const newLeftColumnMembers = leftColumnMembers.filter(
      (m) => !checkedValues.includes(m.userId),
    );
    setLeftColumnMembers(newLeftColumnMembers);

    const newCheckedMembers = leftColumnMembers.filter((m) =>
      checkedValues.includes(m.userId),
    );
    setRightColumnMembers([...rightColumnMembers, ...newCheckedMembers]);
  };

  const handleInputChange = (value: string) => {
    // 从 fullMembers 中减去 rightColumnMembers 中的数据
    const availableMembers = fullMembers.filter(
      (m) => !rightColumnMembers.some((r) => r.userId === m.userId),
    );

    if (value) {
      const matchedMembers = availableMembers.filter((m) =>
        m.nickName.includes(value),
      );
      setLeftColumnMembers(matchedMembers);
    } else {
      setLeftColumnMembers(availableMembers);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setLeftCheckedMembers([]);
    setRightColumnMembers([]);
    setLeftColumnMembers([]);
    run({ spaceId, role: undefined, kw: '' });
  }, [spaceId, open]);

  return (
    <CustomFormModal
      form={form}
      title="添加新成员"
      classNames={{
        content: cx(styles['add-member-modal-content']),
      }}
      open={open}
      onCancel={cancelModal}
      onConfirm={handlerSubmit}
    >
      <div style={{ display: 'flex', gap: 20 }}>
        <div className={cx(styles['add-member-left-column'])}>
          <Input
            placeholder="搜索成员"
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
              <Checkbox
                key={m.userId}
                value={m.userId}
                className={'flex mb-12'}
              >
                <Avatar src={m.avatar || personalImage} /> {m.nickName}
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
              <List.Item style={{ borderBlockEnd: 0 }}>
                <Avatar src={m.avatar || personalImage} /> {m.nickName}
                <Select
                  value={m.role}
                  onChange={(value) => handleRoleChange(m.userId, value)}
                  style={{ width: 100, marginLeft: 10 }}
                  options={selectOptions}
                />
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => handleRemoveMember(m.userId)}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </CustomFormModal>
  );
};

export default AddMember;
