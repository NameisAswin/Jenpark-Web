import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes';
import { fetchProfileThunk } from './store/slices/authThunks';
import { selectIsAuthenticated } from './store/slices/authSlice';

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfileThunk());
    }
  }, [dispatch, isAuthenticated]);

  return <AppRoutes />;
}
