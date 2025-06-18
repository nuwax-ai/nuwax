import { BINDING_DEFAULT_JSON_DATA } from '@/constants/agent.constants';
import { PluginBindingProps } from '@/types/interfaces/agentConfig';
import { UpOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 插件绑定组件
const PluginBinding: React.FC<PluginBindingProps> = ({
  targetComponentInfo,
  onClick,
}) => {
  // 旋转图标
  const [isRotate, setIsRotate] = React.useState(true);
  return (
    <>
      <div className={cx(styles['bind-box'], 'mb-16')}>
        {!targetComponentInfo ? (
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
              src={targetComponentInfo.icon}
              alt=""
            />
            <span>{targetComponentInfo.name}</span>
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
          <UpOutlined className={cx({ [styles['icon-rotate']]: isRotate })} />
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

export default PluginBinding;
