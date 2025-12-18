import { apiPublishedCategoryList } from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { SquareAgentInfo, SquareCategoryInfo } from '@/types/interfaces/square';
import { useModel, useRequest } from 'umi';

const useCategory = () => {
  const {
    setAgentInfoList,
    setPluginInfoList,
    setWorkflowInfoList,
    setTemplateList,
    setSkillInfoList,
  } = useModel('squareModel');

  // 广场分类列表信息
  const handleCategoryList = (result: SquareCategoryInfo[]) => {
    let _agentInfoList: SquareAgentInfo[] = [];
    let _pluginInfoList: SquareAgentInfo[] = [];
    let _workflowInfoList: SquareAgentInfo[] = [];
    let _templateList: SquareAgentInfo[] = [];
    let _skillInfoList: SquareAgentInfo[] = [];
    result?.forEach((info) => {
      const list = info?.children?.map((item) => {
        return {
          name: item.key,
          description: item.label,
        };
      }) as SquareAgentInfo[];
      if (info.type === SquareAgentTypeEnum.Agent) {
        _agentInfoList = list;
      }

      if (info.type === SquareAgentTypeEnum.Plugin) {
        _pluginInfoList = list;
      }

      if (info.type === SquareAgentTypeEnum.Workflow) {
        _workflowInfoList = list;
      }
      if (info.type === SquareAgentTypeEnum.Template) {
        _templateList = list;
      }
      if (info.type === SquareAgentTypeEnum.Skill) {
        _skillInfoList = list;
      }
    });
    setAgentInfoList(_agentInfoList);
    setPluginInfoList(_pluginInfoList);
    setWorkflowInfoList(_workflowInfoList);
    setTemplateList(_templateList);
    setSkillInfoList(_skillInfoList);
  };

  // 广场-智能体与插件分类
  const { run: runQueryCategory } = useRequest(apiPublishedCategoryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: SquareCategoryInfo[]) => {
      handleCategoryList(result);
    },
  });

  return {
    runQueryCategory,
  };
};

export default useCategory;
