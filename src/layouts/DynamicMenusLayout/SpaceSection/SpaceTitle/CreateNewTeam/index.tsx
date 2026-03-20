import teamImage from '@/assets/images/team_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { SPACE_ID } from '@/constants/home.constants';
import { apiCreateSpaceTeam } from '@/services/workspace';
import type { CreateNewTeamProps } from '@/types/interfaces/layouts';
import { MenuItemDto } from '@/types/interfaces/menu';
import type { CreateSpaceTeamParams } from '@/types/interfaces/workspace';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history, useLocation, useModel, useParams, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建新工作空间组件
 */
const CreateNewTeam: React.FC<CreateNewTeamProps> = ({ open, onCancel }) => {
  const location = useLocation();
  const params = useParams();
  const { pathname } = location;

  const [imageUrl, setImageUrl] = useState<string>('');
  const [form] = Form.useForm();
  const { runSpace, setSpaceList } = useModel('spaceModel');

  // 获取二级菜单
  const { getSecondLevelMenus } = useModel('menuModel');

  // 创建工作空间新团队
  const { run, loading } = useRequest(apiCreateSpaceTeam, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: number) => {
      message.success('新建成功');
      setImageUrl('');
      // 关闭弹窗
      onCancel();
      // 更新空间列表
      const { code, data } = await runSpace();
      if (code === SUCCESS_CODE) {
        setSpaceList(data || []);
      }
      if (result) {
        const spaceId = result;
        localStorage.setItem(SPACE_ID, spaceId.toString());

        // 路由跳转，根据当前路径跳转到新的空间
        const paramKeys = Object.keys(params || {});

        // 仅当当前路由参数只有 spaceId 时，复用当前页面的 pathname，只替换空间 id
        if (paramKeys.length === 1 && paramKeys[0] === 'spaceId') {
          const oldSpaceId = String(
            (params as Record<string, unknown>)?.spaceId,
          );

          // 替换 /space/{oldSpaceId}/... 中的 oldSpaceId
          const nextPathname = pathname.replace(
            new RegExp(`/space/${oldSpaceId}(?=/|$)`),
            `/space/${spaceId}`,
          );

          const nextUrl = `${nextPathname}${location.search || ''}`;
          history.push(nextUrl);
          return;
        }

        // 特殊处理：如果当前路径包含 library、plugin、knowledge、table，则跳转到 library 页面
        if (
          pathname.includes('library') ||
          pathname.includes('plugin') ||
          pathname.includes('knowledge') ||
          pathname.includes('table')
        ) {
          history.push(`/space/${spaceId}/library`);
          return;
        }

        // 特殊处理：如果当前路径包含 skill-details，则跳转到 skill-manage 页面
        if (pathname.includes('skill-details')) {
          history.push(`/space/${spaceId}/skill-manage`);
          return;
        }

        // 获取工作空间下的二级菜单
        const secondMenus: MenuItemDto[] = getSecondLevelMenus('workspace');

        // 兜底：替换失败或当前路由参数不满足要求时，回到空间根路径
        const firstPathMenu = secondMenus?.find((m) => !!m.path);

        if (firstPathMenu?.path) {
          const menuPathWithoutQuery = firstPathMenu.path.split('?')[0];

          // 兜底场景下：使用第一个可用菜单 path，并替换其中的 :spaceId
          const resolvedPath = menuPathWithoutQuery.replace(
            /:spaceId\b/g,
            String(spaceId),
          );

          history.push(resolvedPath);
        } else {
          history.push(`/space/${spaceId}/develop}`);
        }
      }
    },
  });

  const onFinish: FormProps<CreateSpaceTeamParams>['onFinish'] = (values) => {
    run({
      icon: imageUrl,
      name: values?.name,
      description: values?.description,
    });
  };

  const handleOk = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title="创建团队空间"
      open={open}
      onCancel={onCancel}
      loading={loading}
      onConfirm={handleOk}
    >
      <div className={cx('flex', 'flex-col', 'items-center', 'py-16')}>
        <p className={cx(styles['create-team-tips'])}>
          通过创建团队空间，将支持项目、智能体、插件、工作流和知识库在团队内进行协作和共享。
        </p>
        <UploadAvatar
          className={styles['upload-box']}
          onUploadSuccess={setImageUrl}
          imageUrl={imageUrl}
          defaultImage={teamImage as string}
        />
        <Form
          form={form}
          preserve={false}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          rootClassName={cx('w-full')}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="团队名称"
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="请输入团队名称" showCount maxLength={50} />
          </Form.Item>
          <OverrideTextArea name="description" label="描述" />
        </Form>
      </div>
    </CustomFormModal>
  );
};

export default CreateNewTeam;
