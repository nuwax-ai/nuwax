import { Button, Checkbox, Form, Input, Modal, Space, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import type { PluginCardProps } from '../PluginCard';
import styles from './index.less';

export interface PluginParam {
  name: string;
  description: string;
  required: boolean;
}

export interface PluginShareModalProps {
  visible: boolean;
  plugin?: PluginCardProps & {
    params?: PluginParam[];
    publisherInfo?: string;
    documentation?: string;
  };
  isEdit?: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
}

const PluginShareModal: React.FC<PluginShareModalProps> = ({
  visible,
  plugin,
  isEdit = false,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [pluginParams, setPluginParams] = useState<PluginParam[]>([]);

  useEffect(() => {
    if (visible && plugin) {
      // 当弹窗显示并且有插件数据时，初始化表单
      form.setFieldsValue({
        title: plugin.title,
        description: plugin.description,
        publisherInfo: plugin.publisherInfo || '',
        documentation: plugin.documentation || '',
      });
      setPluginParams(
        plugin.params || [
          {
            name: 'offset',
            description: '从返回结果前要跳过的基于零的',
            required: true,
          },
          {
            name: 'subArg',
            description:
              '响应中返回的搜索结果数量。默认为10，最大值为50。实际返回结...',
            required: false,
          },
          {
            name: 'query',
            description: '用户的搜索查询词。查询词不能为空。',
            required: false,
          },
        ],
      );
    }
  }, [visible, plugin, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave({
        ...values,
        params: pluginParams,
      });
    });
  };

  const handleDownload = () => {
    // 下载逻辑
    console.log('下载插件配置');
  };

  const handleSaveDraft = () => {
    // 保存草稿逻辑
    form.validateFields().then((values) => {
      console.log('保存草稿', values);
      // 这里可以添加保存草稿的逻辑
    });
  };

  const columns = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
    },
    {
      title: '参数描述',
      dataIndex: 'description',
      key: 'description',
      width: '60%',
    },
    {
      title: '启用必填',
      dataIndex: 'required',
      key: 'required',
      width: '20%',
      render: (required: boolean, record: PluginParam, index: number) => (
        <Checkbox
          checked={required}
          onChange={(e) => {
            const newParams = [...pluginParams];
            newParams[index].required = e.target.checked;
            setPluginParams(newParams);
          }}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          {isEdit ? '编辑分享' : '创建分享'}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={720}
      footer={null}
      className={styles.pluginShareModal}
      destroyOnClose
    >
      <div className={styles.modalContent}>
        <Form form={form} layout="vertical" className={styles.form}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>插件信息</div>
            <div className={styles.basicInfo}>
              {plugin && (
                <div className={styles.pluginInfo}>
                  <img
                    src={plugin.icon}
                    alt={plugin.title}
                    className={styles.pluginIcon}
                  />
                  <div className={styles.pluginDesc}>
                    <div className={styles.pluginTitle}>{plugin.title}</div>
                    <div className={styles.pluginDescription}>
                      {plugin.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>发布者信息</div>
            <Form.Item
              name="publisherInfo"
              rules={[{ required: true, message: '请输入发布者信息' }]}
            >
              <Input
                placeholder="请输入发布者信息，比如：女娲官方"
                maxLength={30}
                showCount
              />
            </Form.Item>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>插件参数</div>
            <Table
              dataSource={pluginParams}
              columns={columns}
              pagination={false}
              rowKey="name"
              className={styles.paramsTable}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>使用文档</div>
            <Form.Item
              name="documentation"
              rules={[{ required: true, message: '请输入使用文档' }]}
            >
              <Input.TextArea
                placeholder="请输入使用文档，支持markdown格式"
                autoSize={{ minRows: 6, maxRows: 10 }}
                className={styles.docTextarea}
              />
            </Form.Item>
          </div>
        </Form>

        <div className={styles.footer}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            {isEdit && <Button onClick={handleDownload}>下线</Button>}
            <Button onClick={handleSaveDraft}>保存草稿</Button>
            <Button type="primary" onClick={handleSave}>
              保存并发布分享
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default PluginShareModal;
