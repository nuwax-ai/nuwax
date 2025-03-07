// 递归计算节点深度
import { BindConfigWithSub } from '@/types/interfaces/agent';
// 递归计算节点深度
const getNodeDepth = (
  treeData: BindConfigWithSub[],
  key: string,
  depth = 1,
): number => {
  for (const node of treeData) {
    if (node.key === key) return depth;
    if (node.subArgs) {
      const found = getNodeDepth(node.subArgs, key, depth + 1);
      if (found) return found;
    }
  }
  return 0;
};

// 添加子节点
export const addChildNode = (treeData: BindConfigWithSub[], parentKey: string, newNode: BindConfigWithSub) => {
  const depth = getNodeDepth(treeData, parentKey);
  if (depth >= 4) return;
  const updateRecursive = (arr: BindConfigWithSub[]): BindConfigWithSub[] => (
    arr.map((node) => {
      if (node.key === parentKey) {
        return {
          ...node,
          subArgs: [...(node.subArgs || []), newNode],
        };
      }
      if (node.subArgs) {
        return { ...node, subArgs: updateRecursive(node.subArgs) };
      }
      return node;
    })
  );

  return updateRecursive(treeData);
};

// export const activeKey = (arr: BindConfigWithSub[]) => {
//   const filterRecursive = (data: BindConfigWithSub[]): string
//   [] =>
//     data.filter((node) => {
//       if (node.key === key) return false;
//       if (node.subArgs) node.subArgs = filterRecursive(node.subArgs);
//       return true;
//     });
//
//   return filterRecursive(arr);
// };

// 删除节点
export const deleteNode = (arr: BindConfigWithSub[], key: string) => {
  const filterRecursive = (data: BindConfigWithSub[]): BindConfigWithSub[] =>
    data.filter((node) => {
      if (node.key === key) return false;
      if (node.subArgs) node.subArgs = filterRecursive(node.subArgs);
      return true;
    });

  return filterRecursive(arr);
};

// 更新节点字段
export const updateNodeField = (arr: BindConfigWithSub[], key: string, field: string, value: any) => {
  const updateRecursive = (data: BindConfigWithSub[]): BindConfigWithSub[] =>
    data.map((node) => {
      if (node.key === key) {
        return { ...node, [field]: value };
      }
      if (node.subArgs) {
        return { ...node, subArgs: updateRecursive(node.subArgs) };
      }
      return node;
    });

  return updateRecursive(arr);
};