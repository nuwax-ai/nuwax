import { apiPublishedCategoryList } from '@/services/square';
import {
  SquareAgentTypeEnum,
  SquareTemplateTargetTypeEnum,
} from '@/types/enums/square';
import { SquareAgentInfo, SquareCategoryInfo } from '@/types/interfaces/square';
import { useEffect } from 'react';
import { useLocation, useModel, useRequest } from 'umi';

const useCategory = () => {
  const {
    agentInfoList,
    pageAppInfoList,
    workflowInfoList,
    skillInfoList,
    setAgentInfoList,
    setPageAppInfoList,
    setPluginInfoList,
    setWorkflowInfoList,
    setTemplateList,
    setSkillInfoList,
  } = useModel('squareModel');

  // 广场分类列表信息
  const handleCategoryList = (result: SquareCategoryInfo[]) => {
    let _agentInfoList: SquareAgentInfo[] = [];
    // 网页应用
    let _pageAppInfoList: SquareAgentInfo[] = [];
    let _pluginInfoList: SquareAgentInfo[] = [];
    let _workflowInfoList: SquareAgentInfo[] = [];
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
      // 网页应用
      if (info.type === SquareAgentTypeEnum.PageApp) {
        _pageAppInfoList = list;
      }

      if (info.type === SquareAgentTypeEnum.Plugin) {
        _pluginInfoList = list;
      }

      if (info.type === SquareAgentTypeEnum.Workflow) {
        _workflowInfoList = list;
      }
      if (info.type === SquareAgentTypeEnum.Skill) {
        _skillInfoList = list;
      }
    });
    setAgentInfoList(_agentInfoList);
    setPageAppInfoList(_pageAppInfoList);
    setPluginInfoList(_pluginInfoList);
    setWorkflowInfoList(_workflowInfoList);
    setSkillInfoList(_skillInfoList);
  };

  const location = useLocation();
  useEffect(() => {
    // 获取url search参数
    const searchParams = new URLSearchParams(location.search);
    const cate_name = searchParams.get('cate_name') || '';
    switch (cate_name) {
      case SquareTemplateTargetTypeEnum.ChatBot:
        setTemplateList(agentInfoList);
        break;
      case SquareTemplateTargetTypeEnum.PageApp:
        setTemplateList(pageAppInfoList);
        break;
      case SquareTemplateTargetTypeEnum.Workflow:
        setTemplateList(workflowInfoList);
        break;
      case SquareTemplateTargetTypeEnum.Skill:
        setTemplateList(skillInfoList);
        break;
      default:
        setTemplateList([]);
        break;
    }
  }, [
    location,
    agentInfoList,
    pageAppInfoList,
    workflowInfoList,
    skillInfoList,
  ]);

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
