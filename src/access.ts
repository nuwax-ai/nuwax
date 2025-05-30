// 在这里按照初始化数据定义项目中的权限，统一管理
// 参考文档 https://umijs.org/docs/max/access
export default (initialState: any) => {
  const canAdmin = initialState?.userInfo?.role === 'Admin' || false;
  return {
    canAdmin,
  };
};
