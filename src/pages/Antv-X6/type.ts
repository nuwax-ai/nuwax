export interface Child {
  title: string;
  image: string;
  key: string;
  type: string;
  content?: string;
}

export interface StencilList {
  name: string;
  key: string;
  children: Child[];
}
