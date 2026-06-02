import { useDispatch, useSelector } from 'react-redux';
import { logout, selectAuth, selectIsAuthenticated } from '../store/slices/authSlice';

export default function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated,
    signOut: () => dispatch(logout()),
  };
}
