import { PageDevelopCreateTypeEnum } from './enums/pageDev';

export interface PageInfo {
  id: number;
  name: string;
  type: PageDevelopCreateTypeEnum;
  creatorId: number;
  created: string;
  modified: string;
  category: string;
}
