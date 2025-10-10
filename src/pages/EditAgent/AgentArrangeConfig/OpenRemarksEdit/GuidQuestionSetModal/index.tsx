import { SvgIcon } from '@/components/base';
import SelectList from '@/components/custom/SelectList';
import TooltipIcon from '@/components/custom/TooltipIcon';
import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { GUID_QUESTION_SET_OPTIONS } from '@/constants/agent.constants';
import { ParamsSettingDefaultOptions } from '@/constants/common.constants';
import { BindValueType, GuidQuestionSetTypeEnum } from '@/types/enums/agent';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Form,
  FormProps,
  Input,
  Select,
  Space,
  Table,
  TableColumnsType,
  theme,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 开场白预置问题设置弹窗Props
export interface GuidQuestionSetModalProps {
  open: boolean;
  variables: BindConfigWithSub[];
  onCancel: () => void;
  onConfirm: (result: number) => void;
}

/**
 * 开场白预置问题设置弹窗
 */
const GuidQuestionSetModal: React.FC<GuidQuestionSetModalProps> = ({
  open,
  variables,
  onCancel,
  onConfirm,
}) => {
  const { token } = theme.useToken();
  // 是否展开
  const [isActive, setIsActive] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');
  // 类型
  const [type, setType] = useState<React.Key>(GuidQuestionSetTypeEnum.Question);

  // // 新增智能体接口
  // const { run: runAdd } = useRequest(apiAgentAdd, {
  //   manual: true,
  //   debounceInterval: 300,
  //   onSuccess: (result: number) => {
  //     onConfirm?.(result);
  //     setLoading(false);
  //   },
  //   onError: () => {
  //     setLoading(false);
  //   },
  // });

  const initForm = () => {
    form.setFieldsValue({
      name: 1,
    });
  };

  useEffect(() => {
    if (open) {
      initForm();
    }
  }, [open]);

  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log('onFinish', values);
    setLoading(true);
    onConfirm?.(values.name);
    setLoading(false);
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 上传图标成功
  const handleUploadSuccess = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('icon', url);
  };

  // 切换类型时，根据类型设置对应的表单项
  const handleChangeType = (value: React.Key) => {
    // form.setFieldValue('type', value);
    setType(value);
  };

  // 缓存变量列表
  const variableList = useMemo(() => {
    return (
      variables?.map((item) => {
        return {
          label: item.name,
          value: item.name,
        };
      }) || []
    );
  }, [variables]);

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: () => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <span>参数值</span>
          <TooltipIcon
            title="可以在输入框中动态引用参数，留空的参数将由大模型自动补充
              智能体ID {{AGENT_ID}}     
              系统用户ID {{SYS_USER_ID}}    
              用户UID {{USER_UID}}
              用户名 {{USER_NAME}}"
            icon={<InfoCircleOutlined />}
          />
        </div>
      ),
      key: 'bindValue',
      width: 230,
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <Space.Compact block>
            <SelectList
              className={cx(styles.select)}
              // disabled={isDefaultValueDisabled(record)}
              value={record.bindValueType}
              // onChange={(value) =>
              //   handleInputValue(record.key, 'bindValueType', value)
              // }
              options={ParamsSettingDefaultOptions}
            />
            {record.bindValueType === BindValueType.Input ? (
              <Input
                rootClassName={cx(styles.select)}
                placeholder="请填写"
                // disabled={isDefaultValueDisabled(record)}
                value={record.bindValue}
                // onChange={(e) =>
                //   handleInputValue(record.key, 'bindValue', e.target.value)
                // }
              />
            ) : (
              <Select
                placeholder="请选择"
                // disabled={isDefaultValueDisabled(record)}
                rootClassName={cx(styles.select)}
                popupMatchSelectWidth={false}
                value={record.bindValue || null}
                // onChange={(value) =>
                //   handleInputValue(record.key, 'bindValue', value)
                // }
                options={variableList}
              />
            )}
          </Space.Compact>
        </div>
      ),
    },
  ];

  // 切换页面路径，修改智能体变量参数
  const changePagePath = (value: React.Key) => {
    console.log('changePagePath', value);
  };

  return (
    <CustomFormModal
      form={form}
      title="预置问题设置"
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            // className={cx(styles['upload-box'])}
            onUploadSuccess={handleUploadSuccess}
            defaultImage={''}
            imageUrl={imageUrl}
            // svgIconName="icons-workspace-knowledge"
          />
        </Form.Item>
        <Form.Item name="displayInfo" label="展示信息">
          <Input placeholder="这里是问题内容" />
        </Form.Item>
        <Form.Item name="type" label="类型">
          <SelectList
            placeholder="请选择类型"
            options={GUID_QUESTION_SET_OPTIONS}
            onChange={handleChangeType}
          />
        </Form.Item>
        {type === GuidQuestionSetTypeEnum.Question ? (
          <Form.Item name="question" label="问题">
            <Input placeholder="请输入问题" />
          </Form.Item>
        ) : type === GuidQuestionSetTypeEnum.Page_Path ? (
          <Form.Item
            name="pagePath"
            label="页面路径（页面组件中已添加的页面下的路径作为可选列表）"
          >
            <SelectList
              placeholder="请选择页面路径"
              options={variableList}
              onChange={changePagePath}
            />
          </Form.Item>
        ) : (
          type === GuidQuestionSetTypeEnum.Link && (
            <Form.Item name="linkUrl" label="链接地址（类型为外链时展示）">
              <Input placeholder="https://xxxxxxx" />
            </Form.Item>
          )
        )}
      </Form>
      <div className={cx(styles['input-box'], 'flex', 'items-center')}>
        <SvgIcon
          name="icons-common-caret_right"
          rotate={isActive ? 90 : 0}
          style={{ color: token.colorTextTertiary }}
          onClick={() => setIsActive(!isActive)}
        />
        <span className={cx('user-select-none')}>输入</span>
        <TooltipIcon title="输入" icon={<InfoCircleOutlined />} />
      </div>
      <Table<BindConfigWithSub>
        className={cx('mb-16', 'flex-1')}
        columns={inputColumns}
        dataSource={[]}
        pagination={false}
        virtual
        scroll={{
          y: 480,
        }}
      />
    </CustomFormModal>
  );
};

export default GuidQuestionSetModal;
