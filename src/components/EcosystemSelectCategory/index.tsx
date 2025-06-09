//http://testagent.xspaceagi.com/api/published/category/list
// 通过异步调用获取分类列表

import { getCategoryListApi } from '@/services/ecosystem';
import { Select } from 'antd';
import { useEffect, useState } from 'react';

export default function SelectCategory({
  onChange,
  targetType,
}: {
  onChange: (value: string) => void;
  targetType: string;
}) {
  const [categoryList, setCategoryList] = useState<any[]>([
    { label: '全部', value: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const getCategoryList = async (theTargetType: string) => {
    setLoading(true);
    const data = await getCategoryListApi();
    setLoading(false);
    if (data && data.length > 0) {
      const targetList = data.filter(
        (item: any) => item.type === theTargetType,
      );
      const list =
        targetList?.[0]?.children?.map((item: any) => ({
          label: item.label,
          value: item.key,
        })) || [];
      list.unshift({ label: '全部', value: '' });
      setCategoryList(list);
    }
  };
  useEffect(() => {
    if (targetType) {
      setCategoryList([]);
      getCategoryList(targetType);
    }
    return () => {
      setCategoryList([]);
    };
  }, [targetType]);

  const handleChange = (value: string) => {
    onChange(value);
  };
  return (
    <Select
      key={targetType}
      style={{ width: 120, marginLeft: 12 }}
      loading={loading}
      options={categoryList}
      onChange={handleChange}
      defaultValue={''}
      placeholder="请选择分类"
    />
  );
}
