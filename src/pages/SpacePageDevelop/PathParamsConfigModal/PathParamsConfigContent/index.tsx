import LabelStar from '@/components/LabelStar';
import { COMMON_TABLE_STYLE } from '@/constants/layout.constants';
import { AFFERENT_MODE_LIST } from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import { apiPageSavePathArgs } from '@/services/pageDev';
import { InputTypeEnum } from '@/types/enums/common';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { PageArgConfig } from '@/types/interfaces/pageDev';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Empty,
  Input,
  message,
  Select,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 路径参数配置内容Props
 */
export interface PathParamsConfigContentProps {
  projectId?: number;
  currentPathParam: PageArgConfig | null;
  onConfirmSave: (data: PageArgConfig) => void;
}

/**
 * 路径参数配置内容
 */
const PathParamsConfigContent: React.FC<PathParamsConfigContentProps> = ({
  projectId,
  currentPathParam,
  onConfirmSave,
}) => {
  // 入参配置
  const [inputConfigArgs, setInputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );
  // 是否加载中
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setInputConfigArgs(currentPathParam?.args || []);
  }, [currentPathParam]);

  // 入参配置 - 新增
  const handleInputConfigAdd = () => {
    const _inputConfigArgs = [...inputConfigArgs];
    _inputConfigArgs.push({
      key: uuidv4(),
      name: '',
      description: '',
      inputType: InputTypeEnum.Query,
      displayName: '',
      require: false,
      bindValue: '',
      enable: true,
    });
    setInputConfigArgs(_inputConfigArgs);
  };

  // 入参配置 - 删除
  const handleInputDel = (key: React.Key) => {
    const _inputConfigArgs = inputConfigArgs.filter(
      (item: BindConfigWithSub) => item.key !== key,
    );
    setInputConfigArgs(_inputConfigArgs);
  };

  // 保存路径参数
  const { run: runSavePathArgs } = useRequest(apiPageSavePathArgs, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_: null, params: PageArgConfig[]) => {
      setLoading(false);
      message.success(dict('PC.Toast.Global.savedSuccessfully'));
      const info = params[0];
      onConfirmSave(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 保存
  const handleSave = () => {
    setLoading(true);
    const params = {
      ...currentPathParam,
      projectId,
      args: inputConfigArgs,
    };
    runSavePathArgs(params);
  };

  // 入参配置 - changeValue
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: string | number | boolean,
  ) => {
    const _inputConfigArgs = [...inputConfigArgs];
    _inputConfigArgs.forEach((item: BindConfigWithSub) => {
      if (item.key === key) {
        item[attr] = value;
      }
    });
    setInputConfigArgs(_inputConfigArgs);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: (
        <LabelStar
          label={dict(
            'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramName',
          )}
        />
      ),
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
      render: (value, record) => (
        <Input
          placeholder={dict(
            'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramNamePlaceholder',
          )}
          value={value}
          onChange={(e) => handleInputValue(record.key, 'name', e.target.value)}
        />
      ),
    },
    {
      title: (
        <LabelStar
          label={dict(
            'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramDescription',
          )}
        />
      ),
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <Input
          placeholder={dict(
            'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramDescriptionPlaceholder',
          )}
          value={value}
          onChange={(e) =>
            handleInputValue(record.key, 'description', e.target.value)
          }
        />
      ),
    },
    {
      title: (
        <LabelStar
          label={dict(
            'PC.Pages.SpacePageDevelop.PathParamsConfigContent.inputType',
          )}
        />
      ),
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
      render: (value, record) => (
        <Select
          options={AFFERENT_MODE_LIST.filter(
            (item) =>
              item.value !== InputTypeEnum.Header &&
              item.value !== InputTypeEnum.Body,
          )}
          value={value}
          onChange={(value) => handleInputValue(record.key, 'inputType', value)}
        />
      ),
    },
    {
      title: dict(
        'PC.Pages.SpacePageDevelop.PathParamsConfigContent.isRequired',
      ),
      dataIndex: 'require',
      key: 'require',
      width: 100,
      align: 'center',
      render: (value, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Checkbox
            checked={value}
            onChange={(e) =>
              handleInputValue(record.key, 'require', e.target.checked)
            }
          />
        </div>
      ),
    },
    {
      title: dict(
        'PC.Pages.SpacePageDevelop.PathParamsConfigContent.defaultValue',
      ),
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
      render: (value, record) => (
        <Input
          placeholder={dict(
            'PC.Pages.SpacePageDevelop.PathParamsConfigContent.defaultValuePlaceholder',
          )}
          value={value}
          onChange={(e) =>
            handleInputValue(record.key, 'bindValue', e.target.value)
          }
        />
      ),
    },
    {
      title: dict('PC.Pages.SpacePageDevelop.PathParamsConfigContent.enable'),
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (value: boolean, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Checkbox
            disabled={record.require && !record.bindValue}
            checked={value}
            onChange={(e) =>
              handleInputValue(record.key, 'enable', e.target.checked)
            }
          />
        </div>
      ),
    },
    {
      title: dict('PC.Pages.SpacePageDevelop.PathParamsConfigContent.action'),
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleInputDel(record.key)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      {!currentPathParam ? (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Empty
            description={dict(
              'PC.Pages.SpacePageDevelop.PathParamsConfigContent.noPathParams',
            )}
          />
        </div>
      ) : (
        <>
          <Button
            className={cx(styles['add-btn'])}
            icon={<PlusOutlined />}
            onClick={handleInputConfigAdd}
          >
            {dict('PC.Pages.SpacePageDevelop.PathParamsConfigContent.addParam')}
          </Button>

          <Table<BindConfigWithSub>
            columns={inputColumns}
            dataSource={inputConfigArgs}
            virtual
            scroll={{
              y: 460,
            }}
            style={COMMON_TABLE_STYLE}
            pagination={false}
          />
          <footer className={cx(styles.footer)}>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {dict('PC.Common.Global.save')}
            </Button>
          </footer>
        </>
      )}
    </div>
  );
};

export default PathParamsConfigContent;
