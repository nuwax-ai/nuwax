import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { useModel } from 'umi';
import ExpandTextArea from './expandTextarea';
import { ExpandableInputTextareaProps } from './type';
// 可以展开输入的inputTextarea
export const ExpandableInputTextarea: React.FC<
  ExpandableInputTextareaProps
> = ({
  title,
  value,
  onChange,
  placeholder,
  rows = 3,
  onExpand,
  onOptimize,
}) => {
  //

  const { setExpand } = useModel('model');
  return (
    <div className="node-item-style">
      <div className="dis-sb margin-bottom">
        {/* 名称 */}
        <span className="node-title-style">{title}</span>
        <div>
          {/* 是否有展开 */}
          {onExpand && <ExpandAltOutlined onClick={() => setExpand(true)} />}
          {/* 是否有优化 */}
          {onOptimize && <ICON_OPTIMIZE />}
        </div>
      </div>
      {/* 输入框 */}
      <Input.TextArea
        value={value}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        autoSize={{ minRows: rows, maxRows: rows }}
        style={{ marginBottom: '10px' }}
      />
      {/* 如果有展开，就要调用展开的组件 */}
      <ExpandTextArea
        title={title}
        value={value}
        onChange={(value: string) => onChange(value)}
        marginRight={400}
      />
    </div>
  );
};

export default ExpandableInputTextarea;
