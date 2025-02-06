import { KnowledgeTextCreateSetEnum } from '@/types/enums/library';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建设置
 */
const CreateSet: React.FC = () => {
  const [createSet, setCreateSet] = useState<KnowledgeTextCreateSetEnum>(
    KnowledgeTextCreateSetEnum.Auto_Segmentation_Cleaning,
  );

  return (
    <>
      <div
        className={cx(
          styles['set-box'],
          'px-16',
          'py-16',
          'cursor-pointer',
          {
            [styles.active]:
              createSet ===
              KnowledgeTextCreateSetEnum.Auto_Segmentation_Cleaning,
          },
          styles['mt-50'],
        )}
        onClick={() =>
          setCreateSet(KnowledgeTextCreateSetEnum.Auto_Segmentation_Cleaning)
        }
      >
        <h3>自动分段与清洗</h3>
        <p>自动分段与预处理规则</p>
      </div>
      <div
        className={cx(styles['set-box'], 'px-16', 'py-16', 'cursor-pointer', {
          [styles.active]: createSet === KnowledgeTextCreateSetEnum.Custom,
        })}
        onClick={() => setCreateSet(KnowledgeTextCreateSetEnum.Custom)}
      >
        <h3>自定义</h3>
        <p>自定义分段规则，分段长度及预处理规则</p>
        <div
          className={cx({
            [styles['custom-set-hide']]:
              createSet ===
              KnowledgeTextCreateSetEnum.Auto_Segmentation_Cleaning,
          })}
        >
          <div className={cx(styles['divider-horizontal'])} />
          <Form layout="vertical" requiredMark={customizeRequiredMark}>
            <Form.Item
              name="segmentIdentifier"
              label="分段标识符"
              rules={[{ required: true, message: '输入分段标识符' }]}
            >
              <Input placeholder="输入分段标识符，例如 \n 换行" />
            </Form.Item>
            <Form.Item
              name="segmentMaxLength"
              label="分段最大长度"
              rules={[{ required: true, message: '请输入100-5000的数值' }]}
            >
              <Input placeholder="请输入100-5000的数值" />
            </Form.Item>
            <Form.Item
              name="segmentOverlap"
              label="分段重叠数%"
              rules={[{ required: true, message: '请输入0-100的数值' }]}
            >
              <Input placeholder="请输入0-100的数值" />
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
};

export default CreateSet;
