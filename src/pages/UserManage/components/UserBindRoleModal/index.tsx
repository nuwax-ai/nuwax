import CustomFormModal from '@/components/CustomFormModal';
import { apiGetRoleList } from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { RoleInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import { customizeRequiredMark } from '@/utils/form';
import { Button, Checkbox, Form, FormProps, message, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiSystemUserBindRole,
  apiSystemUserListRole,
} from '../../user-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface UserBindRoleModalProps {
  open: boolean;
  targetId: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 用户绑定角色弹窗
 * @param open 是否打开
 * @param onCancel 取消回调
 * @returns
 */
const UserBindRoleModal: React.FC<UserBindRoleModalProps> = ({
  open,
  targetId,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  // 已绑定的角色ID列表
  const [bindedRoleIds, setBindedRoleIds] = useState<number[]>([]);

  // 查询用户绑定的角色列表
  const { run: runBindedRoleList } = useRequest(apiSystemUserListRole, {
    manual: true,
    onSuccess: (data: RoleInfo[]) => {
      if (data?.length > 0) {
        setBindedRoleIds(data.map((item) => item.id));
      }
    },
  });

  // 查询角色列表
  const { run: runGetRoleList, data: roleList } = useRequest(apiGetRoleList, {
    manual: true,
  });

  // 绑定角色
  const { run: runBindRole } = useRequest(apiSystemUserBindRole, {
    manual: true,
    onSuccess: () => {
      message.success('绑定成功');
      setLoading(false);
      onConfirm();
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    if (open) {
      // 查询角色列表
      runGetRoleList();
      // 查询用户绑定的角色列表
      runBindedRoleList(targetId);
    } else {
      form.resetFields();
      setBindedRoleIds([]);
    }
  }, [open, targetId]);

  useEffect(() => {
    // 回显角色列表
    if (roleList?.length > 0 && bindedRoleIds.length > 0) {
      form.setFieldsValue({
        roleIds: bindedRoleIds,
      });
    }
  }, [roleList, bindedRoleIds]);

  // 绑定角色
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    const roleIds = values.roleIds || [];
    setLoading(true);
    runBindRole({
      userId: targetId,
      roleIds,
    });
  };

  // 提交表单
  const handlerSubmit = () => {
    form.submit();
  };

  // 获取当前选中的角色ID
  const selectedRoleIds = Form.useWatch('roleIds', form) || [];

  // 获取所有角色ID
  const allRoleIds = roleList?.map((item: RoleInfo) => item.id) || [];

  // 判断是否全部选中
  const isAllSelected =
    allRoleIds.length > 0 &&
    allRoleIds.every((id: number) => selectedRoleIds.includes(id));

  // 全选/取消全选
  const handleSelectAll = () => {
    if (isAllSelected) {
      // 取消全选
      form.setFieldsValue({
        roleIds: [],
      });
    } else {
      // 全选
      form.setFieldsValue({
        roleIds: allRoleIds,
      });
    }
  };

  return (
    <CustomFormModal
      form={form}
      title="绑定角色"
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <Form
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="roleIds"
          label={
            <Button
              type="link"
              size="small"
              onClick={handleSelectAll}
              style={{ padding: 0, height: 'auto' }}
            >
              {isAllSelected ? '取消全选' : '全选'}
            </Button>
          }
        >
          <Checkbox.Group className={cx(styles.checkboxGroup)}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {roleList?.map((item: RoleInfo) => (
                <Checkbox key={item.id} value={item.id}>
                  {item.name}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default UserBindRoleModal;
