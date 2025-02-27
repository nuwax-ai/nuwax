import { AgentComponentTypeEnum } from '@/types/enums/agent';
// 引用默认图标
import Database from '@/assets/images/database_image.png';
import Knowledge from '@/assets/images/knowledge_image.png';
import Plugin from '@/assets/images/plugin_image.png';
import {
  default as Model,
  default as Trigger,
  default as Variable,
  default as Workflow,
} from '@/assets/images/workflow_image.png';

const imageList = {
  Database,
  Knowledge,
  Plugin,
  Workflow,
  Trigger,
  Variable,
  Model,
};

export const getImg = (data: AgentComponentTypeEnum) => {
  return imageList[data];
};
