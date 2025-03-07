import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { getTime } from '@/utils';
import {
  CheckCircleOutlined,
  EditOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  CheckboxChangeEvent,
  Form,
  FormProps,
  Input,
  Modal,
  Tag,
} from 'antd';
import React, { useState } from 'react';
// import { PluginPublishScopeEnum } from '@/types/enums/plugin';
interface Values {
  scope: PluginPublishScopeEnum;
  remark?: string;
  id?: number;
}
interface HeaderProp {
  info: {
    name?: string;
    icon?: string;
    publishStatus?: string;
    created?: string;
    modified?: string;
    id?: number;
  };

  onSubmit: (params: Values) => void;

  setShowCreateWorkflow: () => void;
}

interface PublishedProp {
  id: number;
  open: boolean;
  onCancel: () => void;
  onSubmit: (params: Values) => void;
}

const Published: React.FC<PublishedProp> = ({
  id,
  open,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [scope, setScope] = useState<PluginPublishScopeEnum>(
    PluginPublishScopeEnum.Tenant,
  );

  const onFinish: FormProps<{
    scope: PluginPublishScopeEnum;
    remark: string;
  }>['onFinish'] = (values) => {
    onSubmit({ id, scope, remark: values.remark });
    form.resetFields();
    onCancel();
  };

  const handleChangeScope = (e: CheckboxChangeEvent) => {
    setScope(e.target.value as PluginPublishScopeEnum);
  };

  return (
    <Modal
      open={open}
      title={'发布工作流'}
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      onCancel={onCancel}
      cancelText="取消"
      okText="确认"
      onOk={() => {
        form.submit();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ id }}
      >
        <Form.Item label="发布范围">
          <Checkbox
            value={PluginPublishScopeEnum.Tenant}
            checked={scope === PluginPublishScopeEnum.Tenant}
            onChange={handleChangeScope}
          >
            全局
          </Checkbox>
          <Checkbox
            value={PluginPublishScopeEnum.Space}
            checked={scope === PluginPublishScopeEnum.Space}
            onChange={handleChangeScope}
          >
            工作空间
          </Checkbox>
        </Form.Item>
        <Form.Item name={'remark'} label="发布记录">
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder="这里填写详细的发布记录，如果范围选择了全局，审核通过后，所有工作空间均可引用该工作流"
          ></Input.TextArea>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const Header: React.FC<HeaderProp> = ({
  info,
  onSubmit,
  setShowCreateWorkflow,
}) => {
  const { name, icon, publishStatus, modified } = info;
  const [open, setOpen] = useState(false);

  // 返回上一级
  const bank = () => {
    history.back();
  };

  return (
    <div className="fold-header-style dis-sb">
      <div className="dis-left">
        <LeftOutlined className="back-icon-style" onClick={bank} />
        {icon && <img src={icon} alt="" className="header-icon-style" />}
        <div className="dis-col header-content-style ">
          <div className="dis-left ">
            <span className="header-name-style">{name}</span>
            <EditOutlined className="mr-16" onClick={setShowCreateWorkflow} />
            <CheckCircleOutlined />
          </div>
          <div className="header-tag-style">
            <Tag>工作流</Tag>
            <Tag>{publishStatus === 'Published' ? '已发布' : '未发布'}</Tag>
            <span>
              配置自动保存于{getTime(modified ?? new Date().toString())}
            </span>
          </div>
        </div>
      </div>
      <Button onClick={() => setOpen(true)} type={'primary'}>
        发布
      </Button>

      <Published
        id={info.id || 0}
        open={open}
        onSubmit={onSubmit}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
};

export default Header;
