import FormItemsRender from '@/components/TestRun/FormItemsRender';
import { InputAndOutConfig } from '@/types/interfaces/node';

export interface ParameterConfigProps {
  value?: InputAndOutConfig[];
  onChange?: (value: InputAndOutConfig[]) => void;
}

const ParameterConfig: React.FC<ParameterConfigProps> = ({ value = [] }) => {
  return (
    <>
      <FormItemsRender items={value} loading={false} options={undefined} />
    </>
  );
};

export default ParameterConfig;
