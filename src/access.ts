import type { UserInfo } from '@/types/interfaces/login';

export default (initialState: {
  currentUser?: UserInfo;
  permissions?: string[];
}) => {
  const { currentUser, permissions = [] } = initialState || {};

  return {
    canAdmin: currentUser && currentUser.role === 'Admin',
    isUser: currentUser && currentUser.role === 'User',
    permissions,
  };
};
