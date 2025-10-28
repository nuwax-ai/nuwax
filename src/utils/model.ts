import type {
  GroupModelItem,
  ModelListItemProps,
} from '@/types/interfaces/model';
// 根据apiProtocol将模型重组为二维数组
export const groupModelsByApiProtocol = (
  models: ModelListItemProps[],
): GroupModelItem[] => {
  const grouped: GroupModelItem[] = [
    { label: 'OpenAI', options: [] },
    { label: 'Ollama', options: [] },
  ];

  // 将模型分配到对应的分组
  models.forEach((model) => {
    const targetGroup = grouped.find(
      (group) => group.label === model.apiProtocol,
    );
    if (targetGroup) {
      targetGroup.options.push(model);
    }
  });

  return grouped;
};
