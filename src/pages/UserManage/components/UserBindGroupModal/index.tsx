import CustomFormModal from '@/components/CustomFormModal';
import { apiGetUserGroupList } from '@/pages/SystemManagement/MenuPermission/services/user-group-manage';
import { UserGroupInfo } from '@/pages/SystemManagement/MenuPermission/types/user-group-manage';
import { customizeRequiredMark } from '@/utils/form';
import { Checkbox, Col, Form, FormProps, message, Row } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiSystemUserBindGroup,
  apiSystemUserListGroup,
} from '../../user-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface UserBindGroupModalProps {
  open: boolean;
  targetId: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 用户绑定用户组弹窗
 * @param open 是否打开
 * @param onCancel 取消回调
 * @returns
 */
const UserBindGroupModal: React.FC<UserBindGroupModalProps> = ({
  open,
  targetId,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  // 已绑定的组ID列表
  const [bindedGroupIds, setBindedGroupIds] = useState<number[]>([]);

  // 查询用户绑定的组列表
  const { run: runBindedGroupList } = useRequest(apiSystemUserListGroup, {
    manual: true,
    onSuccess: (data: UserGroupInfo[]) => {
      if (data?.length > 0) {
        setBindedGroupIds(data.map((item) => item.id));
      }
    },
  });

  // 根据条件查询组列表
  const { run: runGetGroupList, data: groupList } = useRequest(
    apiGetUserGroupList,
    {
      manual: true,
    },
  );

  // 绑定组
  const { run: runBindGroup } = useRequest(apiSystemUserBindGroup, {
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
      // 根据条件查询组列表
      runGetGroupList();
      // 查询用户绑定的组列表
      runBindedGroupList(targetId);
    } else {
      form.resetFields();
      setBindedGroupIds([]);
    }
  }, [open, targetId]);

  useEffect(() => {
    // 回显组列表
    if (groupList?.length > 0 && bindedGroupIds.length > 0) {
      form.setFieldsValue({
        groupIds: bindedGroupIds,
      });
    }
  }, [groupList, bindedGroupIds]);

  // 绑定组
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    const groupIds = values.groupIds || [];
    setLoading(true);
    runBindGroup({
      userId: targetId,
      groupIds,
    });
  };

  // 提交表单
  const handlerSubmit = () => {
    form.submit();
  };
  return (
    <CustomFormModal
      form={form}
      title="绑定用户组"
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
        <Form.Item name="groupIds" label="用户组">
          <Checkbox.Group className={cx(styles.checkboxGroup)}>
            <Row gutter={[16, 8]}>
              {groupList?.map((item: UserGroupInfo) => (
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

export default UserBindGroupModal;
