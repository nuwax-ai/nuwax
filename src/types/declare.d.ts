// types/index.d.ts
declare module 'react-beautiful-dnd';
declare module 'classnames';
declare module 'lodash';

// 修改为monaco-editor自带的类型声明
declare module 'monaco-editor/esm/vs/basic-languages/python/python' {
  import { languages } from 'monaco-editor';
  export const conf: languages.LanguageConfiguration;
  export const language: languages.IMonarchLanguage;
}
