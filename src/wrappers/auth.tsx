import { ACCESS_TOKEN } from '@/constants/home.constants';
import { Navigate, Outlet } from 'umi';

const Auth = () => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) {
    return <Outlet />;
  } else {
    return <Navigate to="/login" />;
  }
};

export default Auth;
