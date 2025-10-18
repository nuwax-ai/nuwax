import pageImage from '@/assets/images/agent_image.png';
import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import SelectList from '@/components/custom/SelectList';
import TooltipIcon from '@/components/custom/TooltipIcon';
import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { GUID_QUESTION_SET_OPTIONS } from '@/constants/agent.constants';
import { apiAgentConfigUpdate } from '@/services/agentConfig';
import { BindValueType, GuidQuestionSetTypeEnum } from '@/types/enums/agent';
import {
  AgentConfigUpdateParams,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import {
  GuidQuestionSetModalProps,
  PagePathSelectOption,
} from '@/types/interfaces/agentConfig';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Form,
  FormProps,
  Input,
  message,
  Table,
  TableColumnsType,
  theme,
} from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 开场白预置问题设置弹窗
 */
const GuidQuestionSetModal: React.FC<GuidQuestionSetModalProps> = ({
  open,
  agentConfigInfo,
  currentGuidQuestionDto,
  pageArgConfigs,
  onCancel,
  onConfirm,
  currentGuidQuestionDtoIndex,
}) => {
  const { token } = theme.useToken();
  // 是否展开
  const [isActive, setIsActive] = useState<boolean>(true);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');
  // 类型
  const [type, setType] = useState<React.Key>(GuidQuestionSetTypeEnum.Question);
  // 入参配置
  const [args, setArgs] = useState<BindConfigWithSub[]>([]);
  // 当前路径页面id
  const [currentPageId, setCurrentPageId] = useState<number | null>(null);
  // 页面路径列表
  const [pathList, setPathList] = useState<PagePathSelectOption[]>([]);

  // 更新智能体基础配置信息
  const { run: runUpdate } = useRequest(apiAgentConfigUpdate, {
    manual: true,
    debounceInterval: 1000,
    onSuccess: (_: null, params: AgentConfigUpdateParams[]) => {
      message.success('更新成功');
      const { guidQuestionDtos } = params[0];
      onConfirm?.(guidQuestionDtos);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    // 回显数据
    if (open) {
      if (currentGuidQuestionDto) {
        form.setFieldsValue({
          icon: currentGuidQuestionDto.icon,
          type: currentGuidQuestionDto.type,
          info: currentGuidQuestionDto.info,
          url: currentGuidQuestionDto.url,
        });
        // 类型
        setType(currentGuidQuestionDto.type);
        // 图标
        setImageUrl(currentGuidQuestionDto.icon || pageImage);
        // 回显入参配置
        setArgs(currentGuidQuestionDto.args || []);
        // 当前路径页面id
        setCurrentPageId(currentGuidQuestionDto.pageId || null);
      }

      if (pageArgConfigs?.length > 0) {
        const _pathList: PagePathSelectOption[] = [];
        pageArgConfigs?.forEach((item) => {
          // 添加一个唯一值，因为pageArgConfigs中可能存在相同的pageUri
          const pageUriId = uuidv4();
          _pathList.push({
            label: item.name,
            value: pageUriId,
            // 下拉选择框的值,后续选择页面路径时，需要使用pageUri来作为真正的value值
            pageUri: item.pageUri,
            pageId: item.pageId,
          });

          if (currentGuidQuestionDto?.pageUri === item.pageUri) {
            form.setFieldValue('pageUriId', pageUriId);
          }
        });
        setPathList(_pathList);
      }
    }

    return () => {
      setImageUrl('');
      setArgs([]);
      setCurrentPageId(null);
      setPathList([]);
      setIsActive(true);
    };
  }, [open, currentGuidQuestionDto, pageArgConfigs]);

  // 入参配置 - changeValue
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: string | number | BindValueType,
  ) => {
    const _inputConfigArgs = [...args];
    _inputConfigArgs.forEach((item: BindConfigWithSub) => {
      if (item.key === key) {
        item[attr] = value;
      }
    });
    setArgs(_inputConfigArgs);
  };

  // 表单提交
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    const { pageUriId, ...rest } = values;

    if (rest.type === GuidQuestionSetTypeEnum.Page) {
      const requireArgEmptyItem = args?.find(
        (item) => item.require && !item.bindValue,
      );
      if (requireArgEmptyItem) {
        message.error(
          `参数名：${requireArgEmptyItem.name}是必填参数，参数值不能为空`,
        );
        return;
      }
    }

    // 链接地址类型
    if (rest.type === GuidQuestionSetTypeEnum.Link) {
      const isHttpUrl = rest.url?.startsWith('http');
      if (!isHttpUrl) {
        message.error('链接地址必须以http/https开头');
        return;
      }
    }

    setLoading(true);
    const pageUri = pathList.find((item) => item.value === pageUriId)?.pageUri;
    // 更新后的预置问题
    const newGuidQuestionDto = {
      ...currentGuidQuestionDto,
      ...rest,
      pageUri,
      args,
      // 选择的页面路径的ID
      pageId: currentPageId,
    } as GuidQuestionDto;
    // 源数据
    const _guidQuestionDtos = cloneDeep(
      agentConfigInfo?.guidQuestionDtos || [],
    );
    _guidQuestionDtos[currentGuidQuestionDtoIndex] = newGuidQuestionDto;

    runUpdate({
      ...agentConfigInfo,
      guidQuestionDtos: _guidQuestionDtos,
    });
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
    form.setFieldsValue({
      type: value,
      pageUriId: '',
      url: '',
    });
    setType(value);
    setArgs([]);
  };

  // 切换页面路径，修改智能体变量参数
  const changePagePath = (_: React.Key, option: any) => {
    const { label, pageId, pageUri } = option;
    // 根据页面路径，获取入参配置
    const _config =
      pageArgConfigs.find(
        (item) =>
          item.pageUri === pageUri &&
          item.pageId === pageId &&
          item.name === label,
      ) || null;
    // 当前路径页面id
    setCurrentPageId(pageId);

    // 切换到当前页面路径，回显入参配置
    if (currentGuidQuestionDto?.pageUri === pageUri) {
      setArgs(currentGuidQuestionDto?.args || []);
    } else {
      // 切换到其他页面路径，回显入参配置
      if (_config?.args) {
        const _args = _config.args.map((item) => {
          return {
            ...item,
            bindValueType: item.bindValueType || BindValueType.Input,
          };
        });
        setArgs(_args);
      }
    }
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_: string, record: BindConfigWithSub) => (
        <div className={cx('h-full', 'flex', 'items-center', 'gap-4')}>
          <span>{record.name}</span>
          <ConditionRender condition={record.require}>
            <span className={cx(styles.star)}>*</span>
          </ConditionRender>
        </div>
      ),
    },
    {
      title: () => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <span>参数值</span>
          <TooltipIcon
            title={
              <>
                <div>
                  可以在输入框中动态引用参数，留空的参数将由大模型自动补充
                </div>
                <div>
                  智能体ID {'{{'}AGENT_ID{'}}'}
                </div>
                <div>
                  系统用户ID {'{{'}SYS_USER_ID{'}}'}
                </div>
                <div>
                  用户UID {'{{'}USER_UID{'}}'}
                </div>
                <div>
                  用户名 {'{{'}USER_NAME{'}}'}
                </div>
              </>
            }
            icon={<InfoCircleOutlined />}
          />
        </div>
      ),
      key: 'bindValue',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <Input
            allowClear
            placeholder={`请输入${record.description}`}
            value={record.bindValue}
            onChange={(e) =>
              handleInputValue(record.key, 'bindValue', e.target.value)
            }
          />
        </div>
      ),
    },
  ];

  return (
    <CustomFormModal
      form={form}
      title="预置问题设置"
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
      classNames={{
        body: styles['modal-body'],
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={customizeRequiredMark}
        autoComplete="off"
        preserve={false}
      >
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            onUploadSuccess={handleUploadSuccess}
            defaultImage={''}
            imageUrl={imageUrl}
          />
        </Form.Item>
        <Form.Item
          name="info"
          label="展示信息"
          rules={[{ required: true, message: '请输入展示信息' }]}
        >
          <Input placeholder="这里是问题内容" showCount maxLength={30} />
        </Form.Item>
        <Form.Item name="type" label="类型">
          <SelectList
            placeholder="请选择类型"
            options={GUID_QUESTION_SET_OPTIONS}
            onChange={handleChangeType}
          />
        </Form.Item>
        {type === GuidQuestionSetTypeEnum.Page ? (
          <Form.Item
            name="pageUriId"
            label="页面路径"
            rules={[{ required: true, message: '请选择页面路径' }]}
          >
            <SelectList
              placeholder="请选择页面路径"
              options={pathList as any}
              onChange={changePagePath}
            />
          </Form.Item>
        ) : (
          type === GuidQuestionSetTypeEnum.Link && (
            <Form.Item
              name="url"
              label="链接地址"
              rules={[{ required: true, message: '请选择填写链接地址' }]}
            >
              <Input placeholder="https://www.xxx.com" allowClear />
            </Form.Item>
          )
        )}
      </Form>
      {
        // 扩展页面路径类型时，展示入参配置
        type === GuidQuestionSetTypeEnum.Page && (
          <>
            <div className={cx(styles['input-box'], 'flex', 'items-center')}>
              <SvgIcon
                name="icons-common-caret_right"
                rotate={isActive ? 90 : 0}
                style={{ color: token.colorTextTertiary }}
                onClick={() => setIsActive(!isActive)}
              />
              <span className={cx('user-select-none')}>输入</span>
              <TooltipIcon title="配置输入参数" icon={<InfoCircleOutlined />} />
            </div>
            <div
              className={cx(
                styles['table-collapse-wrapper'],
                isActive && styles['table-collapse-active'],
              )}
            >
              <Table<BindConfigWithSub>
                className={cx('mb-16', 'flex-1')}
                columns={inputColumns}
                dataSource={args}
                pagination={false}
                virtual
                scroll={{
                  y: 480,
                }}
              />
            </div>
          </>
        )
      }
    </CustomFormModal>
  );
};

export default GuidQuestionSetModal;
