import pluginImage from '@/assets/images/plugin_image.png'; // 插件图标
import workflowImage from '@/assets/images/workflow_image.png'; // 插件图标
import { BINDING_DEFAULT_JSON_DATA } from '@/constants/agent.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { VariableDataBindingProps } from '@/types/interfaces/agentConfig';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 变量数据绑定组件
const VariableDataBinding: React.FC<VariableDataBindingProps> = ({
  selectConfig,
  targetComponentInfo,
  onClick,
}) => {
  // 旋转图标
  const [isRotate, setIsRotate] = React.useState(true);
  const { targetType, targetName, targetIcon } = selectConfig || {};
  // 默认图标
  const defaultIcon = [targetComponentInfo?.targetType, targetType].includes(
    AgentComponentTypeEnum.Plugin,
  )
    ? pluginImage
    : workflowImage;

  return (
    <>
      <div className={cx(styles['bind-box'], 'mb-16')}>
        {!targetComponentInfo && !targetName ? (
          <div
            className={cx(
              'flex',
              'items-center',
              'content-center',
              'h-full',
              'cursor-pointer',
            )}
            onClick={onClick}
          >
            请选择符合数据规范的插件或工作流
          </div>
        ) : (
          <div
            className={cx(
              'flex',
              'items-center',
              'h-full',
              'cursor-pointer',
              'px-16',
              'gap-10',
            )}
            onClick={onClick}
          >
            <img
              className={cx(styles['component-image'], 'radius-6')}
              src={targetComponentInfo?.icon || targetIcon || defaultIcon}
              alt=""
            />
            <span>{targetComponentInfo?.name || targetName}</span>
          </div>
        )}
      </div>
      <div className={cx(styles['example-box'])}>
        <div
          className={cx(
            'flex',
            'items-center',
            'content-between',
            'cursor-pointer',
            styles['e-header'],
          )}
          onClick={() => setIsRotate(!isRotate)}
        >
          <span>插件或工作流返回数据结构以及示例</span>
          <DownOutlined
            className={cx(styles.icon, { [styles['icon-rotate']]: !isRotate })}
          />
        </div>
        <div className={cx({ [styles['rotate-box']]: isRotate })}>
          <p>&#x2F;&#x2F;options 选项列表；</p>
          <p>&#x2F;&#x2F;value：选项值；label选项名称；children下级选项</p>
          <pre>
            <code>{JSON.stringify(BINDING_DEFAULT_JSON_DATA, null, 2)}</code>
          </pre>
        </div>
      </div>
    </>
  );
};

export default VariableDataBinding;
