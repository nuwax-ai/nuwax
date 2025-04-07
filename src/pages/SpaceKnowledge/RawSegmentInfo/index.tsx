import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/TooltipIcon';
import {
  apiKnowledgeDocumentUpdateDocName,
  apiKnowledgeRawSegmentList,
} from '@/services/knowledge';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import { KnowledgeDocStatusEnum } from '@/types/enums/library';
import type {
  KnowledgeRawSegmentInfo,
  RawSegmentInfoProps,
} from '@/types/interfaces/knowledge';
import type { Page } from '@/types/interfaces/request';
import { customizeRequiredNoStarMark } from '@/utils/form';
import {
  DeleteOutlined,
  FileSearchOutlined,
  FormOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Button, Empty, Form, FormProps, Input, message, Popover } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 文件 - 分段配置信息
 */
const RawSegmentInfo: React.FC<RawSegmentInfoProps> = ({
  onDel,
  onSuccessUpdateName,
  documentInfo,
}) => {
  const { spaceId } = useParams();
  const [form] = Form.useForm();
  const [hovered, setHovered] = useState<boolean>(false);

  // 知识库文档分段信息
  const [rawSegmentInfoList, setRawSegmentInfoList] = useState<
    KnowledgeRawSegmentInfo[]
  >([]);

  // 知识库分段配置 - 数据列表查询
  const { run: runRawSegmentList, loading } = useRequest(
    apiKnowledgeRawSegmentList,
    {
      manual: true,
      debounceInterval: 300,
      // 设置显示 loading 的延迟时间，避免闪烁
      loadingDelay: 300,
      onSuccess: (result: Page<KnowledgeRawSegmentInfo>) => {
        setRawSegmentInfoList(result.records);
      },
    },
  );

  // 知识库分段配置 - 数据列表查询
  const handleRawSegmentList = (docId: number, current: number = 1) => {
    runRawSegmentList({
      queryFilter: {
        spaceId,
        docId,
      },
      current,
      pageSize: 100,
    });
  };

  useEffect(() => {
    if (!!documentInfo) {
      const { id, docStatus } = documentInfo;
      if (docStatus === KnowledgeDocStatusEnum.ANALYZED) {
        // 知识库分段配置 - 数据列表查询
        handleRawSegmentList(id);
      }
    } else {
      // 文档分段数组清空
      setRawSegmentInfoList([]);
    }
  }, [documentInfo]);

  // const handleChange = (checked: boolean) => {
  //   console.log(`switch to ${checked}`);
  // };

  // 知识库文档配置 - 更改文件名称
  const { run: runUpdateDocName } = useRequest(
    apiKnowledgeDocumentUpdateDocName,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (_, params) => {
        message.success('更新成功');
        setHovered(false);
        const { docId, name } = params[0];
        onSuccessUpdateName(docId, name);
      },
    },
  );

  useEffect(() => {
    if (hovered) {
      form.setFieldValue('name', documentInfo?.name);
    }
  }, [documentInfo, hovered]);

  const onFinish: FormProps<{
    name: string;
  }>['onFinish'] = (values) => {
    const { name } = values;
    runUpdateDocName({
      docId: documentInfo.id,
      name,
    });
  };

  return (
    <div className={cx('flex-1', 'flex', 'flex-col', 'overflow-hide')}>
      <header className={cx(styles.header, 'flex', 'items-center')}>
        <ConditionRender condition={!!documentInfo}>
          <FileSearchOutlined />
          <span>{documentInfo?.name}</span>
          <TooltipIcon
            title="重命名"
            type={TooltipTitleTypeEnum.Blank}
            icon={
              <Popover
                arrow={false}
                trigger="click"
                open={hovered}
                onOpenChange={setHovered}
                placement="bottom"
                content={
                  <Form
                    form={form}
                    layout="vertical"
                    requiredMark={customizeRequiredNoStarMark}
                    onFinish={onFinish}
                  >
                    <Form.Item
                      className={cx(styles.input, 'mb-16')}
                      name="name"
                      label="重命名"
                      rules={[
                        {
                          required: true,
                          message: '文档名称不能为空',
                        },
                      ]}
                    >
                      <Input.TextArea
                        placeholder={'请输入文档名称'}
                        autoSize={{ minRows: 6, maxRows: 30 }}
                      />
                    </Form.Item>
                    <Form.Item className={cx('flex', 'content-end', 'mb-6')}>
                      <Button htmlType="submit" type="primary">
                        确认
                      </Button>
                    </Form.Item>
                  </Form>
                }
              >
                <FormOutlined className={cx('cursor-pointer')} />
              </Popover>
            }
          />
          <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
            {/*<span className={cx(styles['switch-name'])}>预览原始文档</span>*/}
            {/*<Switch defaultChecked onChange={handleChange} />*/}
            <DeleteOutlined
              className={cx(styles.del, 'cursor-pointer')}
              onClick={onDel}
            />
          </div>
        </ConditionRender>
      </header>
      {loading ||
      documentInfo?.docStatus === KnowledgeDocStatusEnum.ANALYZING ? (
        <div
          className={cx(
            'flex',
            'flex-1',
            'items-center',
            'content-center',
            styles['loading-box'],
          )}
        >
          <LoadingOutlined />
          <span>加载中...</span>
        </div>
      ) : rawSegmentInfoList?.length > 0 ? (
        <ul className={cx('px-16', 'py-16', 'flex-1', 'overflow-y')}>
          {rawSegmentInfoList?.map((info) => (
            <li key={info.id} className={cx(styles.line, 'radius-6')}>
              {info.rawTxt}
            </li>
          ))}
        </ul>
      ) : (
        <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
          <Empty description="暂无分段" />
        </div>
      )}
    </div>
  );
};

export default RawSegmentInfo;
