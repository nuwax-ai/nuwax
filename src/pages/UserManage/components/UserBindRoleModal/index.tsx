import CustomFormModal from '@/components/CustomFormModal';
import { apiGetRoleList } from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { RoleInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import { customizeRequiredMark } from '@/utils/form';
import { Checkbox, Col, Form, FormProps, message, Row } from 'antd';
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
        <Form.Item name="roleIds" label="角色">
          <Checkbox.Group className={cx(styles.checkboxGroup)}>
            <Row gutter={[16, 8]}>
              {roleList?.map((item: RoleInfo) => (
                <Col span={8} key={item.id}>
                  <Checkbox value={item.id}>{item.name}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default UserBindRoleModal;
