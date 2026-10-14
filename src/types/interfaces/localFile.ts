/** 本机文件身份；不包含短期授权 URL，不据此推断其它会话的电脑。 */
export interface LocalFileReference {
  contextId: string;
  cId: string;
  path: string;
}
