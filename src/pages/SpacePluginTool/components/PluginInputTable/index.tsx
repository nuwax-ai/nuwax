import LabelStar from '@/components/LabelStar';
import PluginConfigTitle from '@/components/PluginConfigTitle';
import { ICON_ADD_TR } from '@/constants/images.constants';
import { AFFERENT_MODE_LIST } from '@/constants/library.constants';
import { dataTypes } from '@/pages/Antv-X6/params';
import { dict } from '@/services/i18nRuntime';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import { CascaderChange, CascaderValue } from '@/utils';
import { getNodeDepth } from '@/utils/deepNode';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Cascader,
  Checkbox,
  Input,
  Select,
  Table,
  Tooltip,
} from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from '../../index.less';

const cx = classNames.bind(styles);

export interface PluginInputTableProps {
  inputConfigArgs: BindConfigWithSub[];
  expandedRowKeys: React.Key[];
  onInputValue: (key: string, field: string, value: any) => void;
  onInputAddChild: (key: string) => void;
  onInputDel: (key: string) => void;
  onInputConfigAdd: () => void;
}

const PluginInputTable: React.FC<PluginInputTableProps> = ({
  inputConfigArgs,
  expandedRowKeys,
  onInputValue,
  onInputAddChild,
  onInputDel,
  onInputConfigAdd,
}) => {
  const displayRender = (labels: string[]) => labels[labels.length - 1];

  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: <LabelStar label={dict('PC.Pages.SpacePluginTool.paramName')} />,
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
      render: (value, record) => (
        <Input
          placeholder={dict('PC.Pages.SpacePluginTool.inputParamName')}
          value={value}
          onChange={(e) => onInputValue(record.key, 'name', e.target.value)}
        />
      ),
    },
    {
      title: (
        <LabelStar label={dict('PC.Pages.SpacePluginTool.paramDescription')} />
      ),
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <Input
          placeholder={dict('PC.Pages.SpacePluginTool.inputParamDescription')}
          value={value}
          onChange={(e) =>
            onInputValue(record.key, 'description', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label={dict('PC.Pages.SpacePluginTool.paramType')} />,
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (value, record) => (
        <Cascader
          rootClassName={styles.select}
          allowClear={false}
          options={dataTypes}
          expandTrigger="hover"
          displayRender={displayRender}
          defaultValue={CascaderValue(value)}
          onChange={(val) => {
            onInputValue(record.key, 'dataType', CascaderChange(val));
          }}
          placeholder={dict('PC.Pages.SpacePluginTool.selectDataType')}
        />
      ),
    },
    {
      title: <LabelStar label={dict('PC.Pages.SpacePluginTool.inputMode')} />,
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
      render: (value, record) =>
        getNodeDepth(inputConfigArgs, record.key, 1) === 1 && (
          <Select
            rootClassName={styles.select}
            options={AFFERENT_MODE_LIST}
            value={value}
            onChange={(val) => onInputValue(record.key, 'inputType', val)}
          />
        ),
    },
    {
      title: dict('PC.Pages.SpacePluginTool.required'),
      dataIndex: 'require',
      key: 'require',
      width: 100,
      align: 'center',
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            onInputValue(record.key, 'require', e.target.checked)
          }
        />
      ),
    },
    {
      title: dict('PC.Pages.SpacePluginTool.defaultValue'),
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
      render: (value, record) => (
        <Input
          placeholder={dict('PC.Pages.SpacePluginTool.inputDefaultValue')}
          disabled={
            DataTypeEnum.Object === record.dataType ||
            DataTypeEnum.Array_Object === record.dataType ||
            record.dataType?.includes('Array') ||
            !record.enable
          }
          value={value}
          onChange={(e) =>
            onInputValue(record.key, 'bindValue', e.target.value)
          }
        />
      ),
    },
    {
      title: dict('PC.Pages.SpacePluginTool.enable'),
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (value: boolean, record) => (
        <Tooltip
          title={
            record.require &&
            !record.bindValue &&
            dict('PC.Pages.SpacePluginTool.requiredParamTooltip')
          }
        >
          <Checkbox
            disabled={record.require && !record.bindValue}
            checked={value}
            onChange={(e) =>
              onInputValue(record.key, 'enable', e.target.checked)
            }
          />
        </Tooltip>
      ),
    },
    {
      title: dict('PC.Pages.SpacePluginTool.action'),
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record) => {
        return (
          <div className="flex items-center content-end gap-4">
            {(DataTypeEnum.Object === record.dataType ||
              DataTypeEnum.Array_Object === record.dataType) && (
              <Button
                type="text"
                onClick={() => onInputAddChild(record.key)}
                icon={<ICON_ADD_TR />}
              />
            )}
            <Button
              type="text"
              onClick={() => onInputDel(record.key)}
              icon={<DeleteOutlined />}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PluginConfigTitle
        title={dict('PC.Pages.SpacePluginTool.inputConfig')}
        onClick={onInputConfigAdd}
      />
      <Table<BindConfigWithSub>
        className={cx(styles['table-wrap'], styles['mb-24'], 'overflow-hide')}
        columns={inputColumns}
        dataSource={inputConfigArgs}
        pagination={false}
        expandable={{
          childrenColumnName: 'subArgs',
          defaultExpandAllRows: true,
          expandedRowKeys: expandedRowKeys,
          expandIcon: () => null,
        }}
      />
    </>
  );
};

export default PluginInputTable;
