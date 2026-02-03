import CustomFormModal from '@/components/CustomFormModal';
import Loading from '@/components/custom/Loading';
import { Form, Tree } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';
import { apiSystemUserListMenu } from '../../user-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface UserViewMenuModalProps {
  open: boolean;
  userId: number;
  onCancel: () => void;
}

/**
 * 用户查看菜单权限弹窗
 * @param open 是否打开
 * @param userId 用户ID
 * @param onCancel 取消回调
 * @returns
 */
const UserViewMenuModal: React.FC<UserViewMenuModalProps> = ({
  open,
  userId,
  onCancel,
}) => {
  const [form] = Form.useForm();

  // 查询用户的菜单权限列表
  const {
    data: menuList,
    loading,
    run: runGetMenuList,
  } = useRequest(apiSystemUserListMenu, {
    manual: true,
  });

  useEffect(() => {
    if (open && userId > 0) {
      runGetMenuList(userId);
    }
  }, [open, userId]);

  return (
    <CustomFormModal
      form={form}
      title="查看权限"
      open={open}
      onCancel={onCancel}
      onConfirm={onCancel}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <div className={cx(styles.treeContainer)}>
        {loading ? (
          <Loading className={cx(styles.loading)} />
        ) : menuList && menuList.length > 0 ? (
          <Tree
            treeData={menuList}
            defaultExpandAll
            blockNode
            showLine={{ showLeafIcon: false }}
            fieldNames={{
              title: 'name',
              key: 'id',
              children: 'children',
            }}
          />
        ) : (
          <div className={cx(styles.empty)}>暂未配置权限</div>
        )}
      </div>
    </CustomFormModal>
  );
};

export default UserViewMenuModal;
