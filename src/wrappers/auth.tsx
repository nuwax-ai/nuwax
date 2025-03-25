import { ACCESS_TOKEN, EXPIRE_DATE } from '@/constants/home.constants';
import moment from 'moment';
import { Navigate, Outlet } from 'umi';

const Auth = () => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) {
    const expireTime = localStorage.getItem(EXPIRE_DATE);
    const currentTime = moment().millisecond();
    console.log(expireTime, 'expireTime');
    console.log(currentTime, 'currentTime');

    return <Outlet />;
  } else {
    return <Navigate to="/login" />;
  }
};

export default Auth;
