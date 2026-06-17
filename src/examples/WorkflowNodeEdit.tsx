import EditableTitle from '@/components/editableTitle';
import { useEffect, useState } from 'react';

const WorkflowNodeEdit = () => {
  const [value1, setValue1] = useState('this is a test1');
  const [value2, setValue2] = useState('this is a test2');
  useEffect(() => {
    console.log('WorkflowNodeEdit');
  }, []);
  return (
    <div>
      <div style={{ padding: '20px' }}>
        <EditableTitle
          value={value1}
          onSave={(val) => {
            console.log('onSave1', val);
            setValue1(val as string);
            return true;
          }}
          onChange={(val) => {
            console.log('onChange1', val);
            return true;
          }}
          onEditingStatusChange={(val) => {
            console.log('onEditingStatusChange1:是否正在编辑', val);
          }}
        />
      </div>
      <div style={{ padding: '20px' }}>
        <EditableTitle
          value={value2}
          onSave={(val) => {
            console.log('onSave2', val);
            setValue2(val as string);
            return true;
          }}
          onChange={(val) => {
            console.log('onChange2', val);
            return true;
          }}
          onEditingStatusChange={(val) => {
            console.log('onEditingStatusChange2:是否正在编辑', val);
          }}
        />
      </div>
    </div>
  );
};

export default WorkflowNodeEdit;
